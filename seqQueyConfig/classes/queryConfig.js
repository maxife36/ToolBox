const { Sequelize, Op } = require("sequelize")
const msg = require("../assets/messages")
const validator = require("../assets/validators")

class QueryConfig {

    constructor(includes, modelConfig) {

        for (const key in modelConfig) {
            if (key != "newQuery") {
                this[key] = modelConfig[key]
            }
        }

        this.config = {
            include: []
        }

        this.init(includes)
    }

    init(includes) {
        try {

            /* 
            el includes es un array con el nombre de los modelos con los que quiere relacionar su query. En caso de que un modelo tenga mas de una asociacion con una misma tabla, se debera especificar el alias de la asociacion
            */

            validator.seqValidator(this.seqModels, {
                model: this.model,
                associations: includes
            })

            const thisModel = this.seqModels[this.model]


            for (const association of includes) {
                const as = thisModel.associations[association].as

                this.config.include.push({ association: as })
            }
        } catch (err) {
            throw new Error(err.message)
        }
    }

    filterByInteger([gte = 0, lte = 0, order = "DESC"], columnName, association = null) {
        try {
            /* 
            association ? -> nombre de la asociacion de la cual pertenece la columna buscada 
            columnName => nombred de la columna a la cual se le quiere aplicar el filtro
            [gte, lte, order] => gte y lte = INTEGER > 0 && gte < lte / order = "DESC" || "ASC"
            */

            let model = validator.groupCommonValidator(this, [columnName], association, "integer").model

            //validacion de estructura y tipos de datos de parametros de filtrado
            validator.filterNumberValidator([gte, lte, order])

            //Armado de condiciones de busqueda numerica del where
            const condition = [
                gte !== 0 ? { [`$${columnName}$`]: { [Op.gte]: gte } } : null,
                lte !== 0 ? { [`$${columnName}$`]: { [Op.lte]: lte } } : null
            ].filter(Boolean)

            //configuracion del objeto de busqueda

            QueryConfig.updateConfig(this, model, columnName, association, condition, Op.and, order)

        } catch (err) {
            throw new Error(err.message)
        }
    }

    filterByString(keywords, columnName, association = null, config = false) {
        try {
            /* 
            keywords = ["STRING"] -> texto buscado
            column: "columName" // nombre de la columna en donde va a buscar el texto
            association: "association", //Opcional nombre de la asociacion (default = this.model) 
            config : "exact" || "start" || "end" -> tipo de coincidencia.. default busca que incluya
            */

            let model = validator.groupCommonValidator(this, [columnName], association, "string").model

            //limpieza de parametros de busqueda
            const arraySearched = validator.searcherValidatorAndCleaner(keywords)

            //configuracion de opciones de busqueda

            const condition = arraySearched.map(keyword => {

                let wildcardStart = "%"
                let wildcardEnd = "%"

                if (config) {
                    if (config === "start") { wildcardStart = ""; wildcardEnd = "%" }
                    if (config === "end") { wildcardStart = "%"; wildcardEnd = "" }
                    if (config === "exact") { wildcardStart = ""; wildcardEnd = "" }
                }

                const whereOption = {
                    [`$${columnName}$`]: {
                        [Op.like]: `${wildcardStart}${keyword}${wildcardEnd}`
                    }
                }

                return whereOption
            })

            QueryConfig.updateConfig(this, model, columnName, association, condition, Op.or)

        } catch (err) {
            throw new Error(err.message)
        }
    }

    filterByDateRange([gte = 0, lte = 0, order = "DESC"], columnName, association = null) {
        try {

            /* 
            association ? -> nombre de la asociacion de la cual pertenece la columna buscada 
            columnName => nombred de la columna a la cual se le quiere aplicar el filtro
            [gte, lte, order] => gte y lte = DATE > 0 && gte < lte / order = "DESC" || "ASC"
            */

            let model = validator.groupCommonValidator(this, [columnName], association, "date").model

            //validacion de estructura y tipos de datos de parametros de filtrado
            validator.filterDateRangeValidator([gte, lte, order])

            //Armado de condiciones de busqueda por fecha del where
            const condition = [
                gte !== 0 ? { [`$${columnName}$`]: { [Op.gte]: gte } } : null,
                lte !== 0 ? { [`$${columnName}$`]: { [Op.lte]: lte } } : null
            ].filter(Boolean)

            //configuracion del objeto de busqueda

            QueryConfig.updateConfig(this, model, columnName, association, condition, Op.and, order)

        } catch (err) {
            throw new Error(err.message)

        }
    }

    filterByDateParams(day = null, month = null, year = null, columnName, association = null) {
        try {
            /* 
            day = [1 - 31]["NUMBER"]
            month = [0 - 11]["NUMBER"]
            year = [0 - 11]["NUMBER"]
            columnName => nombred de la columna a la cual se le quiere aplicar el filtro
            association ? -> nombre de la asociacion de la cual pertenece la columna buscada 
            */

            let model = validator.groupCommonValidator(this, [columnName], association, "date").model

            //Valido que los parametros de busqueda sean del formato correcto
            validator.numbersDateParamsValidator(day, month, year)

            //Armado de condiciones de busqueda por fecha del where
            const condition = [
                (day === null || day === undefined) ? null : Sequelize.literal(`DAY(${columnName}) = ${day}`),
                (month === null || month === undefined) ? null : Sequelize.literal(`MONTH(${columnName}) = ${month}`),
                (year === null || year === undefined) ? null : Sequelize.literal(`YEAR(${columnName}) = ${year}`)
            ].filter(Boolean)

            QueryConfig.updateConfig(this, model, columnName, association, condition, Op.and)

        } catch (err) {
            throw new Error(err.message)
        }
    }

    addWhere(searchValue, columnName, association = null) {
        try {

            /* 
            searchValue -> Valor buscado, debe ser del mismo valor que la columna en donde se quiere buscar
            columnName => nombred de la columna a la cual se le quiere aplicar el filtro
            association ? -> nombre de la asociacion de la cual pertenece la columna buscada 
            */

            const resultValidator = validator.groupCommonValidator(this, [columnName], association)

            const model = resultValidator.model
            const columnType = resultValidator.attributes[columnName].dataType

            const searchValueType = searchValue.constructor.name === "number" ? "INTEGER" : searchValue.constructor.name.toUpperCase()

            if (columnType !== searchValueType) throw new Error(msg.erroMsg.notValidDatatypeValue + columnType)

            const condition = [
                { [`$${columnName}$`]: searchValue }
            ]

            QueryConfig.updateConfig(this, model, columnName, association, condition, Op.and)

        } catch (err) {
            throw new Error(err.message)
        }
    }

    addAssociation(association, includesRoute = null) {
        try {
            /*
            association -> asociacion final que se desea agregar
            includesRoute -> ruta desde la primer asociacion de la raiz (this.config) hasta la penultima donde se desa agregar association 
            */

            function assocValidators(assocName, model, include, seqModels) {
                if (!assocName) throw new Error(msg.erroMsg.emptyValue)

                //Valido existencia de associaicon dentro de mi modelo
                validator.seqValidator(seqModels, {
                    model: model,
                    associations: [assocName]
                })

                //Valido si ya existe la asociacion en mi include 
                const existAssocInclude = validator.includeAssociationVerify(include, assocName)

                return existAssocInclude
            }

            if (!includesRoute) {

                const existAssocInclude = assocValidators(association, this.model, this.config.include, this.seqModels)

                if (existAssocInclude) throw new Error(msg.erroMsg.duplicateValue + `Ya existe la asociacion ${association}`)

                this.config.include.push({ association })
            } else {
                //Analaiza verifica y crea la ruta hasta donde se quiere realizar la asociacion
                if (!Array.isArray(includesRoute)) throw new Error(msg.erroMsg.wrongFormat)
                if (!includesRoute.length) throw new Error(msg.erroMsg.emptyValue)

                let model = this.model
                let include = this.config.include

                includesRoute.forEach((assoc, index) => {
                    const existAssocInclude = assocValidators(assoc, model, include, this.seqModels)

                    //actualizacion de variable include para siguiente iteracion  
                    if (existAssocInclude) {
                        include = existAssocInclude.include ? existAssocInclude.include : existAssocInclude.include = []
                    } else {
                        include.push({ 
                            association: assoc,
                            include: []
                        })
                        
                        include = include[include.length - 1].include
                    }
                    
                    //actualizacion de variable model para siguiente iteracion  
                    model = this.seqModels[model].associations[assoc].model
                    
                    //Cuando llega al final de la ruta de asociaciones, pushea la asociacion solicitada
                    if ((index + 1) === includesRoute.length) include.push({ association })
                });
            }




            /*  if (!association) throw new Error(msg.erroMsg.emptyValue)
 
             //Valido existencia de associaicon dentro de mi modelo
             validator.seqValidator(this.seqModels, {
                 model: this.model,
                 associations: [association]
             })
 
             //Valido si ya existe la asociacion en mi include 
             const existAssocInclude = validator.includeAssociationVerify(this.config.include, association)
 
             if (existAssocInclude) throw new Error(msg.erroMsg.duplicateValue + `Ya existe la asociacion ${association}`)
 
             this.config.include.push({ association }) */

        } catch (err) {
            throw new Error(err.message)

        }
    }

    addAttribute(columnsName, association = null) {
        try {
            /* 
            columnName = ["colName", "colName", ["colName", "aliasName"], ...] -> Array de nombres de columnas que quiero que se muestren (uno de estos elememntos puede ser a su vez un array con dos eleemntos 1ero el nombre del atributo y 2do el alias que se le quiera dar a esa columna) 
            association ? -> nombre de la asociacion de la cual se le quiere aplicar las restricciones
            */

            if (!Array.isArray(columnsName)) throw new Error(msg.erroMsg.typeError + "Array")

            const resultValidator = validator.groupCommonValidator(this, columnsName, association)

            if (resultValidator.assocObj) {
                resultValidator.assocObj.attributes = columnsName
            }

            this.config.attributes = columnsName

        } catch (err) {
            throw new Error(err.message)
        }
    }

    addLimitOffset(limit, offset, association = null, separate = false) {
        try {

            validator.paramTypeofValidator(limit, "number")
            validator.paramTypeofValidator(offset, "number")

            console.log("-------------");

            const resultValidator = validator.groupCommonValidator(this, null, association)

            if (resultValidator.assocObj) {
                resultValidator.assocObj.separate = separate
                resultValidator.assocObj.limit = limit
                resultValidator.assocObj.offset = offset
            }

            this.config.limit = limit
            this.config.offset = offset

        } catch (err) {
            throw new Error(err.message)
        }
    }

    addLiteral(SQLquery, param, association = null, columnName = null) {
        try {
            /*
            SQLquery -> String que se inyecta dentro de Sequelize.literal()
            param -> pueden ser "attributes", "order", "where" o "having", es decir, bajo que parametro queremos aplicar el literal // NO esta optimizado para aceptar alias cuando se usa sobre attributes
            columnName y association -> OPCIONAL,  en el caso de quere aplicar el literal bajo una columna, se coloca en cual y si la misma se encuentra en alguna asociacion.. por defecto tomara el modelo raiz
            */

            const allowedParams = new Set(["attributes", "order", "where", "having"])

            if (!allowedParams.has(param)) throw new Error(param + " " + msg.erroMsg.notValidParam)

            const columnParam = columnName ? [columnName] : null

            const resultValidator = validator.groupCommonValidator(this, columnParam, association)

            const model = resultValidator.model

            const condition = columnName ? [{ [`$${columnName}$`]: SQLquery }] : SQLquery

            QueryConfig.updateConfig(this, model, columnName, association, condition, Op.and, false, param)

        } catch (err) {
            throw new Error(err.message)
        }
    }

    static updateConfig(queryInstance, model, columnName, association, condition, operator, order = false, isLiteral = false) {
        /*
        isLiteral -> se debe pasar el parametro por el cual quiere asignar el Literal  
        */

        const targetConfig = (model !== queryInstance.model) ? queryInstance.config.include : queryInstance.config;

        function updateConfigObj(obj) {
            const targetWhere = obj.where || (obj.where = {});

            targetWhere[operator] = targetWhere[operator] ? [...targetWhere[operator], ...condition] : condition;

            if (order) {
                const targetOrder = obj.order || (obj.order = []);

                targetOrder.push([`$${columnName}$`, order]); //la modalidad de envolver los nombres de la scolumnas entre $, se hace para que sequelize pueda interopretar sea estrictamente una columna real o un alias asignado
            }
        }

        function updateLiteralConfig(obj) {

            if (isLiteral !== "order" && isLiteral !== "attributes") {
                const targetParam = obj[isLiteral] || (obj[isLiteral] = {});

                targetParam[operator] = targetParam[operator] ? [...targetParam[operator], Sequelize.literal(condition)] : [Sequelize.literal(condition)];

                return
            } else {
                const targetOrder = obj[isLiteral] || (obj[isLiteral] = []);

                targetOrder.push([Sequelize.literal(condition)]); //la modalidad de envolver los nombres de la scolumnas entre $, se hace para que sequelize pueda interopretar sea estrictamente una columna real o un alias asignado
            }
        }

        if (Array.isArray(targetConfig)) {
            for (const assocObj of targetConfig) {
                if (assocObj.association === association) {

                    isLiteral ? updateLiteralConfig(assocObj) : updateConfigObj(assocObj)

                    break
                }
            }
        } else {
            isLiteral ? updateLiteralConfig(targetConfig) : updateConfigObj(targetConfig)
        }


    }

    
    /*     PROXIMOS METODOS
    orderBy(){}
    groupBy(){}
    - Agregar funciones que permitan agregar condiciones where, attribute, order, etc.. en asociaciones de asociaciones (las creadas hasta ahora permiten agregar estos parametros unicamente en el objeto raiz y en sus asociaciones inmediatas) 
    */

}



module.exports = QueryConfig