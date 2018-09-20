module.exports = {
    createDataModel: function createDataModel(rawData) {
        let data = rawData;
        let dataModel = {};

        let intercationNode = data['interaction'];
        let dataNode = data['data'];

        //Node properties
        dataModel.numberOfInputs = 1;
        dataModel.numberOfOutputs = 2;
        dataModel.numberOfOriginalInputs = intercationNode.acceptsInputData.length;
        dataModel.numberOfOriginalOutputs = intercationNode.providesOutputData.length;
        dataModel.node_name = intercationNode.name.toLowerCase();
        dataModel.original_name = intercationNode.name;
        dataModel.raw_name = intercationNode["@type"][0];
        dataModel.node_type = intercationNode["@type"][1].split(':').length > 1 ?
            intercationNode["@type"][1].split(':')[1]:intercationNode["@type"][1];
        dataModel.node_package_name = intercationNode.name.toLowerCase() + "-package";
        dataModel.observable = intercationNode.observable;
        dataModel.node_version = "1.0.0";
        //TODO change for automatic
        dataModel.node_description = "undefined";
        dataModel.repository = "undefined";
        dataModel.license = "undefined";

        let nodeIO = [];
        let nodeOutputs = [];

        //Node outputs
        if (dataModel.numberOfOriginalOutputs > 0) {

            for (let i = 0; i < intercationNode.providesOutputData.length; i++) {
                let ioNode = {type:"output"};
                ioNode.name = intercationNode.providesOutputData[i];
                ioNode.configurations = [];
                ioNode.uniqueDataType = true;
                if(dataNode.length > 0) {
                    let outputElements = dataNode.filter(x => x['@type'] === String(intercationNode.providesOutputData[i]))[0];
                    if (outputElements) {
                        for (let j = 1; j < Object.keys(outputElements).length; j++) {
                            let currentConfiguration = {};
                            currentConfiguration.name = Object.keys(outputElements)[j];

                            //TODO Fix this properly. Get the type from the parser level
                            if (currentConfiguration.name === 'unitCode') {
                                currentConfiguration.type = undefined;
                                currentConfiguration.elementType = "select";
                                let options = [];
                                for (let k = 0; k < Object.keys(outputElements[Object.keys(outputElements)[j]]).length; k++) {
                                    options[k] = outputElements[Object.keys(outputElements)[j]][k]['@id'];
                                }
                                currentConfiguration.options = options;
                            }
                            else if (currentConfiguration.name === 'propertyValues') {
                                currentConfiguration.type = undefined;
                                currentConfiguration.elementType = "checkbox";
                                let options = [];
                                for (let k = 0; k < Object.keys(outputElements[Object.keys(outputElements)[j]]).length; k++) {
                                    options[k] = outputElements[Object.keys(outputElements)[j]][k]['@id'];
                                }
                                currentConfiguration.options = options;
                            }
                            else {
                                currentConfiguration.type = outputElements[Object.keys(outputElements)[j]].split(':')[1];
                                currentConfiguration.elementType = "input";
                            }
                            ioNode.configurations.push(currentConfiguration);
                        }
                }
                }
                nodeIO.push(ioNode);
            }
        }

        //Node inputs
        if (dataModel.numberOfOriginalInputs > 0) {
            for (let i = 0; i < intercationNode.acceptsInputData.length; i++) {
                let ioNode = {type:"input"};
                ioNode.name = intercationNode.acceptsInputData[i];
                ioNode.configurations = [];
                ioNode.uniqueDataType = true;
                if(dataNode.length > 0) {
                    let inputElements = dataNode.filter(x => x['@type'] === String(intercationNode.acceptsInputData[i]))[0];
                    if (inputElements) {
                    for (let j = 1; j < Object.keys(inputElements).length; j++) {
                        let currentConfiguration = {};
                        currentConfiguration.name = Object.keys(inputElements)[j];

                        //TODO Fix this properly. Get the type from the parser level
                        if (currentConfiguration.name === 'unitCode') {
                            currentConfiguration.type = undefined;
                            currentConfiguration.elementType = "select";
                            let options = [];
                            for (let k = 0; k < Object.keys(inputElements[Object.keys(inputElements)[j]]).length; k++) {
                                options[k] = inputElements[Object.keys(inputElements)[j]][k]['@id'];
                            }
                            currentConfiguration.options = options;
                        }
                        else if (currentConfiguration.name === 'propertyValues') {
                            currentConfiguration.type = undefined;
                            currentConfiguration.elementType = "checkbox";
                            let options = [];
                            for (let k = 0; k < Object.keys(inputElements[Object.keys(inputElements)[j]]).length; k++) {
                                options[k] = inputElements[Object.keys(inputElements)[j]][k]['@id'];
                            }
                            currentConfiguration.options = options;
                        }
                        else {
                            currentConfiguration.type = inputElements[Object.keys(inputElements)[j]].split(':')[1];
                            currentConfiguration.elementType = "input";
                        }
                        ioNode.configurations.push(currentConfiguration);
                    }
                }
                }
                if((nodeIO.some( i => i.name === ioNode.name))) {
                   ioNode.uniqueDataType = false;
                }
                nodeIO.push(ioNode);
            }
        }

        dataModel.IO = nodeIO;
        return dataModel;
    }
};
