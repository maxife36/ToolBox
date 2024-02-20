const msg = require("../assets/messages")
const validator = require("../assets/validators")

class ModelConfig {
    /* No extiendo desde General ya que al llamar el metodo super, este ejecuta nuevamente su constructor generando una nueva instancias que ya fue egenrada anteriormente, de esta forma le paso la referencia de los atributos de la instancia de General */

    constructor(model, seqInstance) {

        for (const key in seqInstance) {
            if (key != "newModel") {
                this[key] = seqInstance[key]
            }
        }

        this.model = model
        this.newQuery = this.queryCreate.bind(this) //devuelve una instancia de QueryConfig
        this.modelData = this.modelData.bind(this)

        this.init()
    }

    init() {
        //verifica que el modelo solicitado exista dentro de la instancia de sequelize

        validator.seqValidator(this.seqModels, {
            model: this.model
        })
    }

    queryCreate(includes = []) {

        const QueryConfig = require("./queryConfig")

        return new QueryConfig(includes, this)
    }

    modelData() {
        const modelName = this.model
        const instanceInfo = this.seqModels
        
        console.log(`\n***********  ${modelName} - MODEL DETAILS  ***********\n`);

        console.log(`\n===>  Table Name: ${instanceInfo[modelName].table} \n`);

        console.log(`===> Associations`);
        console.table(instanceInfo[modelName].associations);

        console.log(`\n===> Attributes`);
        console.table(instanceInfo[modelName].attributes);
    }
}


module.exports = ModelConfig