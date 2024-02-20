const validator = require("./assets/validators")

class General {
    //debo pasar una instancia de sequelize para obtener toda la informacion necesaria de los modelos y relaciones de dicha instancia

    constructor(sequelize) {
        this.sequelize = sequelize,
            this.seqModels = {}
        this.newModel = this.modelCreate.bind(this) //devuelve una instancia de ModelConfig
        this.SeqData = this.SeqData.bind(this)

        //Valido que el parametro pasado sea una instancia de Sequelize
        validator.seqInstanceVerify(sequelize)

        //Inyeccion de Info en seqModels
        this.init(sequelize.models)
    }

    init(allModels) {
        //analiza y completa los atributos models, tables, associations segun la instancia de sequelize que se paso 


        for (const model in allModels) {
            const associations = {}
            const attributes = {}

            const modelObj = allModels[model]
            const assocObj = modelObj.associations
            const attsObj = modelObj.rawAttributes

            for (const association in assocObj) {

                const modelAssociation = assocObj[association].target.name

                associations[assocObj[association].as] = {
                    model: modelAssociation,
                    as: assocObj[association].as,
                }

            }

            for (const attribute in attsObj) {
                attributes[attribute] = {
                    fieldName: attribute,
                    dataType: attsObj[attribute].type.constructor.name
                }
            }

            this.seqModels[modelObj.name] = {
                model: modelObj.name,
                table: modelObj.tableName,
                associations,
                attributes
            }
        }

    }

    modelCreate(model) {
        //seqInstance= this lo hago para tener persistencia de datos de la instancia de General y sea accesible para todas las instancias de 

        const ModelConfig = require("./classes/modelConfig")

        return new ModelConfig(model, this) //este this hace refereancia a la instancia ya que en el constructor se bindeo con la misma.. Se podria usar la funcion flecha por su auto bindeo
    }

    SeqData(modelName = null) {
        const instanceInfo = this.seqModels

        if(!modelName){

            console.log(`***********  ALL SEQUELIZE MODELS  ***********\n`);
    
            console.table(Object.keys(instanceInfo));
    
            console.log(`\n***********  MODELS DETAILS  ***********\n`);
    
            for (const modelName in instanceInfo) {
    
                console.log(`\n---------->  Model Name: ${modelName}  /  Table Name: ${instanceInfo[modelName].table} \n`);
    
    
                console.log(`==> Associations`);            
                console.table(instanceInfo[modelName].associations);
                
                console.log(`\n==> Attributes`);
                console.table(instanceInfo[modelName].attributes);
            }
        }else{
            console.log(`\n***********  ${modelName} - MODEL DETAILS  ***********\n`);

            console.log(`\n---------->  Table Name: ${instanceInfo[modelName].table} \n`);
    
    
            console.log(`==> Associations`);            
            console.table(instanceInfo[modelName].associations);
            
            console.log(`\n==> Attributes`);
            console.table(instanceInfo[modelName].attributes);
        }



    }
}


module.exports = (sequelize) => new General(sequelize)
