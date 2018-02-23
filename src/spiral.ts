var Viva =  require( "vivagraphjs" );
var webglSquare = require('vivagraphjs/src/WebGL/webglSquare.js');
import {webglNodeProgram} from './webglNodeProgram'

console.log( Viva)

export class Spiral {
    constructor() {
        var graph = Viva.Graph.graph();
        graph.addLink(1, 2);

        var graphics = Viva.Graph.View.webglGraphics();

        graphics.node( (node)=>{
            return webglSquare(10, '#ff0000')
        });
        graphics.setNodeProgram(webglNodeProgram())

        var renderer = Viva.Graph.View.renderer(graph,
            {
                graphics : graphics
            });
        renderer.run();
    }

}