const path = require("path")
const fs = require("fs")

class AllPaths {
    constructor() {
        this.root= path.resolve(),
        this.folders = { },
        this.files = { }
        this.pathArranger(this.root)
    }

    directoryValidator(pathNode){
       return fs.statSync(pathNode).isDirectory()
    }

    pathArranger(pathNode){

        const allFiles = fs.readdirSync(pathNode)
    
        allFiles.forEach(el => {
            const elPath = path.join(pathNode, el)

    
            const exceptFilesFlag = elPath.includes("node_modules") || elPath.includes(".git")
    
            if (!exceptFilesFlag) {
    
                if (this.directoryValidator(elPath)) {
                    this.folders[el] = elPath
                    this.pathArranger(elPath)
                } else {
                    this.files[el] = elPath
                }
            }
    
        })
    }

}

module.exports = new AllPaths()
