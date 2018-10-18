'use strict' 
/* 
IPShapeParser.js:
----------------
parses an input iot.schema.org Interaction Pattern (IP) shape and
extracts configuration attributes for the given IP node.
This code is used to create a Node-RED node for an iot.schema.org IP.
*/

const sep = require('path').sep;
let ids = [];
let shapes = [];
module.exports = {
    parse :function parser(data)
{
    var json = JSON.parse(data);
    for (var i = 0, j = 0; i < (json['@graph']).length; i++, j++) {
        shapes[j] = json['@graph'][i];
        ids[j] = shapes[j].id;
    }
    initialize();
    var out = getInteractionPatternNode(shapes);


    if (json == null) {
        console.log("Please provide a SHACL shape as input parameter");
    }
    return JSON.stringify(out);
}
}


var ip = {};
var units = [];
var configAttr = {};
var ipdata = [];
var output = {};
var data = [];
function initialize(){
	ip = {};
	ip["@type"] = [];
	units = [];
	configAttr = {};
	ipdata = [];
	output = {};
	ip["acceptsInputData"] = [];
    ip["providesOutputData"] = [];
	data = [];
}
function getInteractionPatternNode(shapes){
	//var data = {};
	for(var i = 0; i < shapes.length; i++){
		if(shapes[i]["sh:targetClass"]){
			if(!shapes[i]["@id"].includes("Data")){
				ip["@type"] = [];
				ip["acceptsInputData"] = [];
				ip["providesOutputData"] = [];
				data = [];
				var ipType = shapes[i]["sh:targetClass"]["@id"];
				ip["@type"].push(ipType);
				//ToDo: Add capability context to the interaction pattern
				//ip["iot:capability"] = .. ;
				ip["name"] = ipType.slice(ipType.lastIndexOf(":")+1);
				var shape = checkNodeType(shapes[i]["@id"]);
				if(ip["@type"].indexOf("iot:Property") == -1){
					ip["@type"].push("iot:Action");
				}
			}
			else if(shapes[i]["@id"].includes("Data")){
				configAttr = {};
				data = [];
				configAttr["@type"] = shapes[i]["sh:targetClass"]["@id"];
				var shape = checkNodeType(shapes[i]["@id"]);
				ipdata.push(configAttr);
			}
			
		}
	}
	output["interaction"] = ip;
	output["data"] = ipdata;
	//console.log(JSON.stringify(output));
	return output;
	
}

function parseNotNode(shape){
	var resultNodeId = shape["sh:not"]["@id"];
	return resultNodeId;
}

function parseAndNode(shape){
	var listNodes = [];
	if(shape["sh:and"]["@list"]){
		listNodes = parseListNode(shape["sh:and"]["@list"]);
	}
	return listNodes;
}

function parseInNode(shape){
	var listNodes = [];
	//console.log("parseInNode");
	if(shape["sh:in"]["@list"]){
		listNodes = parseListNode(shape["sh:in"]["@list"]);
	}	
	return listNodes;
}

function parseListNode(node){
	//console.log("parseListNode");
	var listNodes = [];
	for(var k = 0; k < node.length; k++){
		listNodes.push(node[k]["@id"]);
	}	
	return listNodes;
}

function parsePropertyNode(shape){
	var resultNodeId;
	if(shape["sh:property"]){
		resultNodeId = shape["sh:property"]["@id"];
	}
	//check result node type here or return it to checkNodeType and check it recursively in that function??
	return resultNodeId;
}

function getShape(shapes, nodeId){
	var shape;
	for(var i = 0; i < shapes.length; i++){
		if(shapes[i]["@id"] == nodeId){
			shape = shapes[i];
			break;
		}
	}
	return shape;
}

function checkNodeType(nodeId){

	var shape = getShape(shapes, nodeId);
	var nodeType = "";
	var resultNodeId = "";
	if(shape){
	if(shape["sh:path"]){

		var path = shape["sh:path"]["@id"];
		if(!shape["sh:node"]){
			if(path.includes("providesOutputData") || path.includes("acceptsInputData") ||
			   path.includes("writable") || path.includes("observable")){
			checkIProperties(shape);
			}
			else
			checkDataProperties(shape);
			return shape;
		}
		else{
			if(path.includes("providesOutputData") || path.includes("acceptsInputData") ||
			   path.includes("writable") || path.includes("observable")){
			checkIProperties(shape);
			}
			checkDataProperties(shape);
			checkNodeType(shape["sh:node"]["@id"]);
		}
	}		
	else if(shape["sh:property"]){
		//console.log("PropertyNode");
		nodeType = "PropertyNode";
		resultNodeId = parsePropertyNode(shape);
		checkNodeType(resultNodeId);
	}
	else if(shape["sh:and"]){
		//console.log("AndNode");
		nodeType = "AndNode";
		var listNodes = parseAndNode(shape);
		for(var i = 0; i < listNodes.length; i++){
			checkNodeType(listNodes[i]);
		}
	}	
	else if(shape["sh:in"]){
		//console.log("InNode: "+JSON.stringify(shape));
		nodeType = "InNode";
		var listNodes = parseInNode(shape);
		for(var i = 0; i < listNodes.length; i++){
			checkNodeType(listNodes[i]);
		}		
	}
    else if(shape["sh:not"]){
		//console.log("NotNode");
		nodeType = "NotNode";
		resultNodeId = parseNotNode(shape);
		checkNodeType(resultNodeId);
	}
}

}

function checkIProperties(shape){
	if(shape["sh:path"]["@id"] == "iot:providesOutputData"){
		if(shape["sh:node"]){
		var outputData = shape["sh:node"]["@id"];
		ip["providesOutputData"].push(outputData);
		}
	}
	else if(shape["sh:path"]["@id"] == "iot:acceptsInputData"){
		if(shape["sh:node"]){
		var inputData = shape["sh:node"]["@id"];
		ip["acceptsInputData"].push(inputData);
		}
	}
	else if(shape["sh:path"]["@id"] == "iot:writable"){
		var writable = shape["sh:hasValue"]["@id"];
		ip["writable"] = writable;
		ip["@type"].push("iot:Property");
	}
	else if(shape["sh:path"]["@id"] == "iot:observable"){
		var observable = shape["sh:hasValue"]["@id"];
		ip["observable"] = observable;
	}

}


function checkDataProperties(shape){

	if(shape["sh:path"]["@id"] == "schema:propertyType"){
		//configAttr = {};
		if(shape["sh:datatype"]){
		var propertyType = shape["sh:datatype"]["@id"];
		configAttr["propertyType"] = propertyType;
		}
		else if(shape["sh:in"]){
			var propertyValues = [];
			var temp = shape["sh:in"];
			for(var i=0; i < temp["@list"].length; i++){
				propertyValues.push(temp["@list"][i]);
			}
			configAttr["propertyValues"] = propertyValues;
			data.push(configAttr);
		}
	}
	else if(shape["sh:path"]["@id"] == "schema:minValue"){
		var minValue = shape["sh:datatype"]["@id"];
		configAttr["minValue"] = minValue;
	}
	else if(shape["sh:path"]["@id"] == "schema:maxValue"){
		var maxValue = shape["sh:datatype"]["@id"];
		configAttr["maxValue"] = maxValue;
	}
	else if(shape["sh:path"]["@id"] == "schema:unitCode"){
		units = [];
		var temp = shape["sh:in"];
		for(var i=0; i < temp["@list"].length; i++){
			units.push(temp["@list"][i]);
		}
		configAttr["unitCode"] = units;
		data.push(configAttr);
	}
}
