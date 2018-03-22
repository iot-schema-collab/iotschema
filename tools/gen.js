'use strict'

const fs = require('fs');
const sep = require('path').sep;

const jsonld = require('jsonld').promises;

const ctx = {
    'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
    'schema': 'http://schema.org/',
    'iot': 'http://iotschema.org/',
    'rdfs:subClassOf': {
        '@type': '@vocab'
    },
    'rdfs:seeAlso': {
        '@type': '@vocab'
    }
};

const actions = [];
const events = [];

function isWritableProperty(node) {
    // TODO transitive
    return node['http://www.w3.org/2000/01/rdf-schema#subClassOf'] != undefined && 
        node['http://iotschema.org/writable'] != undefined &&
        node['http://iotschema.org/writable'].some(o => o['@value'] == 'schema:True') &&
        node['http://www.w3.org/2000/01/rdf-schema#subClassOf'].some(o => {
                return o['@id'] === 'http://iotschema.org/Property';
           });
}

function isObservableProperty(node) {
    // TODO transitive
    return node['http://www.w3.org/2000/01/rdf-schema#subClassOf'] != undefined && 
        node['http://iotschema.org/observable'] != undefined &&
        node['http://www.w3.org/2000/01/rdf-schema#subClassOf'].some(o => {
                return o['@id'] === 'http://iotschema.org/Property';
           });
}

function getLocalName(node) {
    return node['@id'].replace('http://iotschema.org/', '');
}

function generate(node) {
    if (isWritableProperty(node)) {
        let name = getLocalName(node);
        
        let a = {
            '@id': 'iot:Set' + name,
            '@type': 'rdfs:Class',
            'rdfs:subClassOf': 'iot:ChangePropertyAction',
            'rdfs:label': 'Set' + name,
            'rdfs:comment': 'Specification of an action acting on some property of type ' + name + '.',
            'rdfs:seeAlso': node['@id']
        }
        actions.push(a);
    }
    if (isObservableProperty(node)) {
        let name = getLocalName(node);

        let e = {
            '@id': 'iot:' + name + 'Changed',
            '@type': 'rdfs:Class',
            'rdfs:subClassOf': 'iot:PropertyChangedEvent',
            'rdfs:label': name + 'Changed',
            'rdfs:comment': 'Specification of an event occurring when some property of type ' + name + ' changes.',
            'rdfs:seeAlso': node['@id']
        }
        events.push(e);
    }
}

fs.readdirSync('..')
    .filter(name => name.endsWith('.jsonld'))
    .forEach(name => {
        let str = fs.readFileSync('..' + sep + name, { encoding: 'utf-8' });
        let def = JSON.parse(str);

        jsonld.flatten(def)
            .then(g => {
                g.forEach(n => generate(n));
            })
            .then(() => {
                let actionData = JSON.stringify({ '@context': ctx, '@graph': actions }, null, '\t');
                fs.writeFileSync('..' + sep + 'property-actions.jsonld', actionData, { encoding: 'utf-8' });
                
                let eventData = JSON.stringify({ '@context': ctx, '@graph': events }, null, '\t');
                fs.writeFileSync('..' + sep + 'property-events.jsonld', eventData, { encoding: 'utf-8' });
            });
    });