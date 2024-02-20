const { Sequelize } = require("sequelize")
const msg = require("./messages")
const uuidValidate = Sequelize.Validator.isUUID


class Validators {
    static idValidator(id) {
        if (!uuidValidate(id)) throw new Error(msg.erroMsg.notValidId)
    }

    static paramTypeofValidator(value, type) {
        const typeFlag = typeof value === type

        if (!typeFlag) throw new Error(msg.erroMsg.typeError + type)
    }

    static seqInstanceVerify(seqInstance) {
        if (!(seqInstance instanceof Sequelize)) throw new Error(msg.erroMsg.typeError + "Instance of Sequelize")
    }

    static includeAssociationVerify(include, association){
        /* 
        include = [{ association:"value" }, { ... } , ...]
        association  = ["STRING"]
        */
       let foundedFlag = null


        for (const assocObj of include) {
            if(assocObj.association === association){
                foundedFlag = assocObj 
                break
            }
        }

        if (!foundedFlag) return false 

        return foundedFlag
    }

    static attributeTypeVerify(seqModels, model, columnName, dataType){

        //dataType -> es el tipo de datos que yo necesito que sea mi columna, y verifico que coincida con el dataType que acepta realemente la columna

        if (columnName.constructor.name === "Literal") return
                   
        const modelObj = seqModels[model]

        if (!modelObj) throw new Error(msg.erroMsg.notExistModel + `Modelo = ${model}`)

     
            
            const attributesObj = modelObj.attributes[columnName]
    
            if (!attributesObj) throw new Error(msg.erroMsg.notExistAttribute + `En Modelo = ${model} no existe Column = ${columnName}`)
    
            if(attributesObj.dataType !== dataType.toUpperCase()) throw new Error(msg.erroMsg.notValidDatatypeAttribute + dataType.toUpperCase())
        

    }

    static seqValidator(seqModels, searchParams) {
        /* 
        seqModels // recibe toda la informacion de la instancia de sequelize

        searchParams = {
            model: "modeloBuscado",
            associations: ["Modelos Asociados", "buscados"],
            attributes: ["nombre de columna buscada", "otro", ["colName", "aliasName"]] (permite verificar la columna incluso si viene dentro de un array con su alias)
        }
        */

        //Verifico existencia de Modelo en mi instancia de sequelize

        const modelName = searchParams.model

        if (!modelName) throw new Error(msg.erroMsg.wrongFormat + searchParams)

        let modelSearched = seqModels[modelName]

        if (!modelSearched) throw new Error(msg.erroMsg.notExistModel + `Modelo = ${modelName}`)

        //Verifico existencia de las asociaciones en mi instancia de sequelize

        const searchAssociations = searchParams.associations

        if (searchAssociations) {
            if (!Array.isArray(searchAssociations)) throw new Error(msg.erroMsg.typeError + "Array")

            if (searchAssociations.length) {

                for (const searchedAssociation of searchAssociations) {

                    let AssociationVerifyFlag = modelSearched.associations[searchedAssociation]

                    if (!AssociationVerifyFlag) throw new Error(msg.erroMsg.notExistAssociation + `En Modelo = ${modelName} no existe asociación = ${searchedAssociation}`)
                }

            }
        }

        //Verifico existencia de las asociaciones en mi instancia de sequelize

        const searchAttributes = searchParams.attributes

        if (searchAttributes) {
            if (!Array.isArray(searchAttributes)) throw new Error(msg.erroMsg.typeError + "Array")

            if (searchAttributes.length) {

                for (const searchedAttribute of searchAttributes) {
                    const attributeName = Array.isArray(searchedAttribute)? searchedAttribute[0] : searchedAttribute

                    if(attributeName.constructor.name === "Literal") continue 

                    const attributeVerifyFlag = modelSearched.attributes[attributeName]

                    if (!attributeVerifyFlag) throw new Error(msg.erroMsg.notExistAttribute + `En Modelo = ${modelName} no existe Column = ${searchedAttribute}`)
                }

            }
        }

    }

    static searcherValidatorAndCleaner(value) {

        //validaciones de parametro

        this.paramTypeofValidator(value, "string")

        let valueArray = value.trim()

        if (!valueArray) throw new Error(msg.erroMsg.emptyValue)

        //limpieza y confeccion del array

        // divide a las palabras que estan separadas por " ","-"" y "_".. y elimina estos valores si estan colocado de mas 
        valueArray = valueArray.split(/[\s\-_]+/)

        return valueArray
    }

    static filterNumberValidator(array) {

        if (typeof array[0] !== "number" || array[0] < 0) throw new Error(msg.erroMsg.wrongFormat + "El primer elemento debe ser un número positivo")

        if (typeof array[1] !== "number" || array[1] < 0) throw new Error(msg.erroMsg.wrongFormat + "El segundo elemento debe ser un número positivo")

        if (array[0] > array[1]) throw new Error(msg.erroMsg.notValidNumbersFilter)

        if (!(array[2] === "DESC" || array[2] === "ASC")) throw new Error(msg.erroMsg.wrongFormat + "El tercer elemento puede ser 'ASC' o  'DESC'")
    }

    static filterDateRangeValidator(array) {

        if (!Sequelize.Validator.isDate(array[0])) throw new Error(msg.erroMsg.wrongFormat + "El primer elemento debe ser dataType: DATE")

        if (!Sequelize.Validator.isDate(array[1])) throw new Error(msg.erroMsg.wrongFormat + "El segundo elemento debe ser dataType: DATE")

        if (array[0] > array[1]) throw new Error(msg.erroMsg.notValidNumbersFilter)

        if (!(array[2] === "DESC" || array[2] === "ASC")) throw new Error(msg.erroMsg.wrongFormat + "El tercer elemento puede ser 'ASC' o  'DESC'")
    }

    static numbersDateParamsValidator(day, month, year){
        const dayRegex = /^(0?[1-9]|[1-2][0-9]|3[0-1])$/;
        const monthRegex = /^(0?[0-9]|1[0-1])$/;
        const yearRegex = /^(19[7-9][0-9]|20[0-9][0-9])$/;

        if(day !== null && !dayRegex.test(day)) throw new Error(msg.erroMsg.notValidDateParam("day", "[1 - 31]"))
        if(month !== null && !monthRegex.test(month)) throw new Error(msg.erroMsg.notValidDateParam("month", "[0 - 11]"))
        if(year !== null && !yearRegex.test(year)) throw new Error(msg.erroMsg.notValidDateParam("year", "[1970 - 2099]"))
    }

    static groupCommonValidator(queryInstance, columnsName, association, columnType = null) {
        /*
        columnsName debe ser un array con las columnas a verificar 
        columnType -> si se agrega un columnType, el columnsName debe tener un solo elemento, caso contrario no lo verificará
        */

        const result = {
            model: queryInstance.model
        }

        if (association) {
            //Valido la existencia de la associacion en mi Modelo
            Validators.seqValidator(queryInstance.seqModels, {
                model: result.model,
                associations: [association]
            })

            // Valido la existencia de la asociacion dentro del config
            const assocInclude = Validators.includeAssociationVerify(queryInstance.config.include, association)

            if (!assocInclude) throw new Error(msg.erroMsg.notAssociationInclude + association)

            result.model = queryInstance.seqModels[result.model].associations[association].model
            result.assocObj = assocInclude
        }

        //verifico la existencia de la columna del modelo solicitado
        if (columnsName && columnsName.length) {

            Validators.seqValidator(queryInstance.seqModels, {
                model: result.model,
                attributes: columnsName
            })

            result.attributes = {}

            for (const columnName of columnsName) {
                const attributeName = Array.isArray(columnName)? columnName[0] : columnName

                if(attributeName.constructor.name === "Literal") continue 
                
                result.attributes[attributeName] = { fieldName: attributeName }
            }

            if (!columnType) {
                //Si no se pasa el parametro de columntype  esta funcion me devuleve un objeto con el modelo al cual pertenece la columna y de que tipo es.. caso contrario devuleve automaticamente el nombre del modelo

                const modelAttributes = queryInstance.seqModels[result.model].attributes

                for (const columnName of columnsName) {
                    const attributeName = Array.isArray(columnName)? columnName[0] : columnName

                    if(attributeName.constructor.name === "Literal") continue 

                    result.attributes[attributeName].dataType = modelAttributes[attributeName].dataType
                }

                return result
            }

            if (columnsName.length === 1) {
                //Solo verifica si se pasa una sola columna
                //valido que la columna solicitada sea de tipo columnType
                Validators.attributeTypeVerify(queryInstance.seqModels, result.model, columnsName[0], columnType)
            }
        }

        return result
    }
}

module.exports = Validators