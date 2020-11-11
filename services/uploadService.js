const express = require('express')
const formidable = require('formidable')
const app = express()
const fs = require('fs-extra')
const path = require('path')
const concat = require('concat-files')

let uploadDir = 'nodeServer/uploads'

// 检查文件的MD5
function checkFileMD5(req, resp) {
	let query = req.query
    let fileName = query.fileName
    let fileMd5Value = query.fileMd5Value
    // 获取文件Chunk列表
    getChunkList(
        path.join(uploadDir, fileName),
        path.join(uploadDir, fileMd5Value),
        data => {
            // resp.json({ 
            //   code: 0, 
            //   msg: '校验完成', 
            //   data
            // })
            resp.send(data)
        }
    )
}

// 判断文件或文件夹是否存在
const isExist = fpath => {
    return new Promise((resolve, reject) => {
        fs.stat(fpath, (err, stats) => {
            // 文件不存在
            if (err == null) {
                resolve(true);
            } else if (err.code == 'ENOENT') {
                resolve(false);
            } else {
                reject(err);
            }
        })
    })
}
// 列出文件夹下所有文件
function listDir(path) {
    return new Promise((resolve, reject) => {
        fs.readdir(path, (err, data) => {
            if (err) {
                reject(err)
                return
            }
            // 把mac系统下的临时文件去掉
            if (data && data.length > 0 && data[0] === '.DS_Store') {
                data.splice(0, 1)
            }
            resolve(data)
        })
    })
}
// 获取文件Chunk列表
async function getChunkList(filePath, folderPath, callback) {
    let isFileExit = await isExist(filePath)
    let result = {}
    // 如果文件(文件名, 如:node-v7.7.4.pkg)已在存在, 不用再继续上传, 真接秒传
    if (isFileExit) {
        result = {
            stat: 1,
            file: {
                isExist: true,
                name: filePath
            },
            desc: '文件已存在'
        }
    } else {
        let isFolderExist = await isExist(folderPath)
        console.log('文件夹路径==>>> ', folderPath)
        // 如果文件夹(md5值后的文件)存在, 就获取已经上传的块
        let fileList = []
        if (isFolderExist) {
            fileList = await listDir(folderPath)
        } else {
            // await fs.ensureDirSync(folderPath)
        }
        result = {
            stat: 1,
            chunkList: fileList,
            desc: '文件夹列表目录'
        }
    }
    callback(result)
}

// 检查chunk的MD5
// function checkChunkMD5(req, resp) {
// 	let query = req.query
//     let chunkIndex = query.index
//     let md5 = query.md5

//     fs.stat(path.join(uploadDir, md5, chunkIndex), (err, stats) => {
//     	resp.send({
//             stat: 1,
//             exit: stats ? true : false,
//             desc: stats ? 'Exit 1' : 'Exit 0'
//         })
//     })
// }

// 上传文件
function upload(req, resp) {
	let form = new formidable.IncomingForm({
        uploadDir: 'nodeServer/tmp'
    })
    // 文件夹是否存在, 不存在则创建文件夹
    const folderIsExit =  folder => {
        console.log(`创建路径${folder}  还有数`, path.join(folder))
        return new Promise(async (resolve, reject) => {
            try {
                await fs.ensureDirSync(path.join(folder))
                resolve(true)
            } catch (err) {
                console.log('错错错错错', err)
            }
        })
    }

    // 把文件从一个目录拷贝到别一个目录
    const copyFile = (src, dest) => {
        console.log(`拷贝文件==>>> 临时${src}  目标目录${dest}`)
        return new Promise((resolve, reject) => {
            fs.rename(src, dest, err => {
                if (err) {
                    reject(err)
                } else {
                    resolve('copy file:' + dest + ' success!')
                }
            })
        })
    }
    form.parse(req, async function(err, fields, file) {
        let index = fields.index
        let total = fields.total
        let fileMd5Value = fields.fileMd5Value
        let folder =  path.resolve(path.join(path.resolve(__dirname), '..'), uploadDir, fileMd5Value)
        let isExit = await folderIsExit(folder)
        console.log(`判断${folder}路径存不存在  ${isExit}`)
        let destFile = path.resolve(folder, fields.index)
        console.log('----------->', file.data.path, destFile)
        copyFile(file.data.path, destFile).then(
            successLog => {
                resp.send({
                    stat: 1,
                    desc: index
                })
            },
            errorLog => {
                resp.send({
                    stat: 0,
                    desc: 'Error'
                })
            }
        )
    })
}

// 合并上传文件
function merge(req, resp) {
	let query = req.query
    let md5 = query.md5
    let size = query.size
    let fileName = query.fileName
    console.log('合并==>>> ', md5, fileName)
    mergeFiles(path.join(uploadDir, md5), uploadDir, fileName, size)
    resp.send({
        stat: 1
    })
}
// 合并文件
async function mergeFiles(srcDir, targetDir, newFileName, size) {
    console.log('合并参数==<<< ', ...arguments)
    let srcDirIsExit = await isExist(srcDir)
    if(srcDirIsExit) {
        let targetStream = fs.createWriteStream(path.join(targetDir, newFileName))
        let fileArr = await listDir(srcDir)
        // 把文件名加上文件夹的前缀
        for (let i = 0; i < fileArr.length; i++) {
            fileArr[i] = srcDir + '/' + fileArr[i]
        }
        concat(fileArr, path.join(targetDir, newFileName), () => {
            console.log('Merge Success!')
        })
    }
    
}

module.exports = {
  checkFileMD5,
  upload,
  merge
}