'use strict' 
/* 
IPShapeParser.js:
----------------
parses an input iot.schema.org Interaction Pattern (IP) shape and
extracts configuration attributes for the given IP node.
This code is used to create a Node-RED node for an iot.schema.org IP.
*/

const sep = require('path').sep;
var ids = [];
var shapes = [];
var shapeJson;
function addConfigAttributes(shapej, configj){
	shapeJson = shapej;
	parseShape(shapej);
	parseConfigAttr(configj);
	return shapeJson;
}
function parseShape(data){
   // var json = JSON.parse(data);
    for (var i = 0, j = 0; i < (data['@graph']).length; i++, j++) {
        shapes[j] = data['@graph'][i];
        ids[j] = shapes[j].id;
    }
    if (data == null) {
        console.log("Please provide a SHACL shape as input parameter");
    }
}
var minval;
var maxval;
var unit = "";
var values = [];
var observable;
var name = "";
var capability  = "";
var foi = "";

function parseConfigAttr(json){
	
    //var json = JSON.parse(data);
	minval = json["configParams"]["minValue"];
	maxval = json["configParams"]["maxValue"];
	unit = json["configParams"]["unitCode"];
	values = json["configParams"]["propertyValues"];
	observable = json["configParams"]["observable"];
	name = json["configParams"]["name"];
	capability = json["configParams"]["capability"];
	foi = json["configParams"]["FeatureOfInterestType"];
    ingrateIntoShape();
}

function ingrateIntoShape(){
	var requiredShape = {};
	if(minval !=undefined){
		requiredShape = getshape("schema:minValue");
		integrateMinConfig(requiredShape, minval);
	}
	if(minval !=undefined){
		requiredShape = getshape("schema:maxValue");
		integrateMaxConfig(requiredShape, maxval);
	}
	if(unit !=undefined){
		requiredShape = getshape("schema:unitCode");
		integrateUnitConfig(requiredShape, unit);
	}	
	if(observable !=undefined){
		requiredShape = getshape("iot:observable");
		integrateObservableConfig(requiredShape, observable);
	}
	if(capability !=undefined){
	for(var m = 0; m < shapes.length; m++){
		if(shapes[m]["sh:targetClass"]){
			if(!shapes[m]["@id"].includes("Data")){
				var temp = {};
				temp = shapes[m];
				if(name!="")
				temp["name"] = name;
			    if(capability!=""){
				var bn = "_:"+randomString();
				temp["sh:and"]["@list"].push({"@id": bn});
				integrateCapabilityConfig(bn);
				}
			    if(foi!=""){
				var bn = "_:"+randomString();
				var rnode = {};
				rnode["@id"] = bn;
				temp["sh:and"]["@list"].push(rnode);
				integrateFoiConfig(bn);
				}				
				delete shapeJson['@graph'].temp;
				shapeJson['@graph'].push(temp);
			}
		}
	}
	}	
	/*if(foi !=undefined){
		requiredShape = getshape("sh:targetClass");
		integrateFoiConfig(requiredShape, foi);
	}*/	
}

function randomString() {
    var charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var blankNode = '';
    for (var i = 0; i < 10; i++) {
        var randomPoz = Math.floor(Math.random() * charSet.length);
        blankNode += charSet.substring(randomPoz,randomPoz+1);
    }
    return blankNode;
}

function integrateMinConfig(shape, attr){
	var index = shapeJson['@graph'].indexOf(shape);
	shapeJson['@graph'].splice( index, 1 );
	var propTypeNode = getPropertyTypeShape();
	delete shapeJson.propTypeNode;
	propTypeNode["sh:minInclusive"] = {};
    propTypeNode["sh:minInclusive"] = attr;
	shapeJson['@graph'].push(propTypeNode);
}

function getPropertyTypeShape(){
	for(var i = 0; i < shapes.length; i++){
	if(shapes[i]["sh:path"]){
		if(shapes[i]["sh:path"]["@id"] == "schema:propertyType"){
				return shapes[i];
			}
		}
	}
}

function integrateMaxConfig(shape, attr){
	var index = shapeJson['@graph'].indexOf(shape);
	shapeJson['@graph'].splice( index, 1 );
	var propTypeNode = getPropertyTypeShape();
	delete shapeJson['@graph'].propTypeNode;
	propTypeNode["sh:maxInclusive"] = {};
    propTypeNode["sh:maxInclusive"] = attr;
	shapeJson['@graph'].push(propTypeNode);	
}

function integrateUnitConfig(shape, attr){
	var temp = shape;
	delete shapeJson['@graph'].shape;
	delete temp["sh:in"];
	temp["sh:hasValue"] = attr;
	shapeJson['@graph'].push(temp);
}

function integrateObservableConfig(shape, attr){
	delete shapeJson['@graph'].shape;
	delete shape["sh:hasValue"];
	shape["sh:hasValue"] = attr;
	shapeJson['@graph'].push(shape);
}

function getshape(shapeAttr){
	/*	for(var m = 0; m < shapes.length; m++){
		console.log(shapes[m]);
	}*/
	for(var m = 0; m < shapes.length; m++){		
		if(shapes[m]["sh:path"]){
			if(shapes[m]["sh:path"]["@id"] == shapeAttr){
				return shapes[m];
			}		
		}
	}
}

function integrateCapabilityConfig(bn){
	var rnode = {};
	var bn2 = "_:"+randomString();
	rnode["@id"] = bn;
	rnode["sh:property"] = {};
	rnode["sh:property"]["@id"] = bn2;
	shapeJson['@graph'].push(rnode);
	
	var capNode = {};
	capNode["@id"] = bn2;
	capNode["sh:maxCount"] = 1;
	capNode["sh:minCount"] = 1;
	capNode["sh:hasValue"] = capability;
	capNode["sh:path"] = {};
	capNode["sh:path"]["@id"] = "iot:capability";
	shapeJson['@graph'].push(capNode);

}

function integrateFoiConfig(bn){
	var rnode = {};
	var bn2 = "_:"+randomString();
	rnode["@id"] = bn;
	rnode["sh:property"] = {};
	rnode["sh:property"]["@id"] = bn2;
	shapeJson['@graph'].push(rnode);
	
	var capNode = {};
	capNode["@id"] = bn2;
	capNode["sh:maxCount"] = 1;
	capNode["sh:minCount"] = 1;
	
	capNode["sh:path"] = {};
	if(observable){
	capNode["sh:path"]["@id"] = "iot:isPropertyOf";
	capNode["sh:hasValue"] = foi;}
	else{
	capNode["sh:path"]["@id"] = "iot:isActionOf";
	capNode["sh:hasValue"] = foi;}
	shapeJson['@graph'].push(capNode);

}
function removeDuplicates(arr){
    var unique_array = []
    for(var i = 0;i < arr.length; i++){
        if(unique_array.indexOf(arr[i]) == -1){
            unique_array.push(arr[i])
        }
    }
    return unique_array
}

module.exports.addConfigAttributes = addConfigAttributes;
module.exports.removeDuplicates = removeDuplicates;