var canvasBackgrounds = "#02181d";
var calt = "#1b3a3b";
var canvasOutlines = "#b5ffff";

/*

    http://www.html5canvastutorials.com/
*/
function canvasInit()
{
    drawTaskBar();
}

function drawTaskBar ()
{
    drawRoundedBox("taskBar",1000,50,15,15,15)
}

function drawRoundedBox (canvasID, rectWidth, rectHeight, rectX, rectY, cornerRadius)
{
    var canvas = document.getElementById(canvasID);
    var context = canvas.getContext("2d");
    
    context.save();    
    context.beginPath();
    
    context.moveTo(rectX+cornerRadius,rectY);

    // Top line and top right corner.
    context.arcTo(rectX+rectWidth,rectY,rectX+rectWidth,rectY+cornerRadius,cornerRadius);

    // Right line and bottom right corner.
    context.arcTo(rectX+rectWidth,rectY+rectHeight,rectX+rectWidth-cornerRadius,rectY+rectHeight,cornerRadius); 

    // Bottom line and bottom left corner.
    context.arcTo(rectX,rectY+rectHeight,rectX,rectY+rectHeight-cornerRadius,cornerRadius);

    // Right line and top left corner.
    context.arcTo(rectX,rectY,rectX+cornerRadius,rectY,cornerRadius);

    
    context.closePath();
    context.fillStyle = canvasBackgrounds;
    context.strokeStyle = canvasOutlines;
    context.lineWidth = 3;
    context.fill();
    context.stroke();
    
 
    context.restore();
}