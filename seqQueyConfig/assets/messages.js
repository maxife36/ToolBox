module.exports = {
    successMsg : {

    },
    erroMsg:{
        emptyTable : "No existen Registros en la tabla ",
        notExistId: "No se encontraron registros con el ID ",
        notExistField: "No se encontraron registros con el campo ",
        incompleteData: "El registro no cumple con los requisitos obligatorios",
        duplicateValue: "No puede haber duplicidad de datos: ",
        typeError: "Se esperaba un valor de tipo: ",
        notValidId: "El ID proporcionado no tiene un formato valido.",
        emptyValue: "Se ingreso un parametro sin contenido",
        wrongFormat: "No es un formato valido: ",
        notValidParam: "No es un parametro Valido",
        notExistModel: "No existe un modelo en la instancia de Sequelize con el nombre: ",
        notExistAssociation: "No existe alguna de las asociaciones en el modelo: ",
        notExistAttribute: "No existe algun atributo en el modelo: ",
        notValidDatatypeAttribute: "La Columna debe tener un dataType: ",
        notValidDatatypeValue: "El valor buscado debe tener un dataType: ",
        notValidNumbersFilter: "Existe una incopatibilidad en los datos de filtardo",
        notAssociationInclude: "No se incluyó la asociacion: ",
        notValidDateParam: (param, range) => `El paramtero ${param} debe ser un numero entre: ${range}`
        
        
    },
    warningMsg:{

    } 
}