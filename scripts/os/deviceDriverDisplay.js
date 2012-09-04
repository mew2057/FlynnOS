/* ----------------------------------
   DeviceDriverDisplay.js
   
   Requires deviceDriver.js
   
   The Kernel Display Device Driver.
   ---------------------------------- */

DeviceDriverDisplay.prototype = new DeviceDriver;  // "Inherit" from prototype DeviceDriver in deviceDriver.js.
function DeviceDriverDisplay()                     // Add or override specific attributes and method pointers.
{
    // "subclass"-specific attributes.
    // this.buffer = "";    // TODO: Do we need this?
    // Override the base method pointers.
    this.driverEntry = krnDispDriverEntry;
    this.isr = krnDispDispatch;
    // "Constructor" code.
}

function krnDispDriverEntry()
{
    // Get a global reference to the canvas.  
    CANVAS  = document.getElementById('display');
    // Get a global reference to the drawing context.
	DRAWING_CONTEXT = CANVAS.getContext('2d');
	// Enable the added-in canvas text functions (see canvastext.js for provenance and details).
	CanvasTextFunctions.enable(DRAWING_CONTEXT);
    
    DRAWING_CONTEXT.fillStyle = CANVAS_BACKGROUNDS;
    DRAWING_CONTEXT.strokeStyle = CANVAS_OUTLINES;

    // Emulates starting the monitor.
    drawRoundedBox(DRAWING_CONTEXT, CANVAS.width,CANVAS.height,CANVAS_RADIUS);

    this.status = "loaded";
}

function krnDispDispatch(params)
{
    alert ("do something");
}