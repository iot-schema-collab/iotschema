"use strict";
const fs = require('fs-extra');
const rdfTranslator = require('rdf-translator');
const handlebars = require('handlebars');
const rimraf = require('rimraf');
const args = require('yargs').argv;

const parser = require('./utils/IPShapeParser');
const utils = require('./utils/utils');
const dir = "IPshapes/";

handlebars.registerHelper("is_equal", function (prop1, prop2, options) {
    if (prop2 === prop1) {
        return options.fn(this);
    }
    else {
        return options.inverse(this);
    }
});

handlebars.registerHelper("is_not_equal", function (prop1, prop2, options) {
    if (prop2 !== prop1) {
        return options.fn(this);
    }
});

handlebars.registerHelper("remove_namespace", function (prop1, options) {
    let candidates = prop1.split(':');
    if (candidates.length > 0) {
        return candidates[1].trim();
    }
    else {
        return candidates[0].trim();
    }
});

handlebars.registerHelper("capitalize_first_letter", function (prop1) {
    return prop1.charAt(0).toUpperCase() + prop1.substr(1);
});

handlebars.registerHelper("greater_than", function (prop1, prop2, options) {
    if (prop1 > prop2) {
        return options.fn(this);
    }
});

handlebars.registerHelper("less_than", function (prop1, prop2, options) {
    if (prop1 < prop2) {
        return options.fn(this);
    }
});

handlebars.registerHelper("is_not_primary_type", function (prop1, options) {
    if (!(prop1.toLowerCase().indexOf("boolean") !== -1 || (prop1.toString()).toLowerCase().indexOf("boolean") !== -1)) {
        return options.fn(this);
    }
});

handlebars.registerHelper("remove_lastCharacter", function (prop1, options) {
    return prop1.slice(0, -1);
});

let configAttrIntegrator = fs.readFileSync("utils/" + "ConfigAttrIntegrator.js");

let shapeFileContent = fs.readFileSync(dir + args.file.split("/")[1], 'utf-8');
let currentNodeName;

rdfTranslator(shapeFileContent, 'n3', 'json-ld', function (err, translatedShape) {
    if (translatedShape != null && !err) {
        let jsonldConversion = parser.parse(translatedShape);

        const packageTemplate = "package.json";
        const jsTemplate = "node.js";
        const htmlTemplate = "node.html";

        let templates = [htmlTemplate, packageTemplate, jsTemplate];

        let temperature_shape_json = JSON.parse(jsonldConversion);
        let dm = utils.createDataModel(temperature_shape_json);
        let generated_node = "GeneratedNodes/" + dm.node_package_name;
        currentNodeName = dm.node_package_name;
        console.log("Generating "+ currentNodeName);

        if (fs.existsSync(generated_node)) {
            rimraf.sync(generated_node);
        }
        fs.mkdirSync(generated_node, '0777');
        fs.writeFileSync(generated_node + "/" + dm.node_name + ".jsonld", translatedShape);
        fs.writeFileSync(generated_node + "/" + "ConfigAttrIntegrator.js", configAttrIntegrator);

        for (let i in templates) {
            const tpl = handlebars.compile(fs.readFileSync("templates/" + templates[i] + ".hbs")
                .toString('utf-8'));
            let fileName = templates[i];
            if (templates[i].split('.')[0] === 'node') {
                fileName = dm.node_name + "." + templates[i].split('.')[1];
            }
            fs.writeFileSync(generated_node + "/" + fileName, tpl(dm));
        }
    }
    else { console.log("Failed to generate "+ currentNodeName +" due to translation server error");}
});
