/*  --------------
    canvasAnimations.js
    
    This class handles drawing canvas shapes on the frontend.
     In focusing these methods into this file I can reduce the clutter
     in my os code scripts and better separate view code from model code.
   
    Useful Resources:    
     http://www.html5canvastutorials.com/
    -------------- */

/**
 * Initialize the canvasi {my favorite fake word}.
 */
function canvasInit()
{
    drawTaskBar();
}

/**
 * Does the initial draw of the task bar and buttons.
 */
function drawTaskBar ()
{
    var button = null;
    
    TASKBAR_CANVAS = document.getElementById("taskBar");
    TASKBAR_CONTEXT = TASKBAR_CANVAS.getContext("2d");
    
    // Set the global styles for this context.
    TASKBAR_CONTEXT.fillStyle = CANVAS_BACKGROUNDS;
    TASKBAR_CONTEXT.strokeStyle = CANVAS_OUTLINES;
    
    // Set the taskbar font.
    TASKBAR_CONTEXT.font = TASKBAR_FONT;    
    
    drawRoundedBox(TASKBAR_CONTEXT,TASKBAR_CANVAS.width,TASKBAR_CANVAS.height,CANVAS_RADIUS);
    
    // Load the power button.
    button = new Button();    
    button.x = 15;
    button.y = 15;
    button.width = button.height = 25;
    
    var powerButton=new Image();
    var powerSelectButton=new Image();

    powerButton.onload = function() {TASKBAR_CONTEXT.drawImage(powerButton,15,15)};
    
    powerButton.src = "images/power.png";
    
    powerSelectButton.onload = function() {};
    powerSelectButton.src = "images/power_select.png";
    

    button.hoverImage = powerSelectButton;
    button.staticImage = powerButton;
    button.funct = simBtnStartOS_click;
    button.functToggle = simBtnHaltOS_click;
    
    drawButton(TASKBAR_CONTEXT, button);

    buttons.push(button);
    //-------------------------
    
    // Load the refresh button.
    button = new Button();     
    button.x = 50;
    button.y = 15;
    button.width = button.height = 25;
    
    var refreshButton= new Image();
    var refreshSelectButton= new Image();
    
    refreshButton.onload = function() {TASKBAR_CONTEXT.drawImage(refreshButton,50,15)};
    refreshButton.src = "images/refresh.png";

    refreshSelectButton.onload = function() {};
    refreshSelectButton.src = "images/refresh_select.png";

  
    button.hoverImage = refreshSelectButton;
    button.staticImage = refreshButton;
    button.funct = simBtnReset_click;
    
    drawButton(TASKBAR_CONTEXT, button);
   
    buttons.push(button);
    
    //-------------------------
    
    // Add the mouse events.
    TASKBAR_CANVAS.addEventListener('mousemove',checkButtons,false);
    TASKBAR_CANVAS.addEventListener('mousedown',buttonClick,false);
}


/**
 * A method to be called within the loop of the Operating System that routinely
 * updates and redraws the taskbar's text fields (e.g the status and time).
 */
function updateTaskBar()
{
    
    var startX =TASKBAR_CANVAS.width/2.5;
    
    TASKBAR_CONTEXT.fillStyle = CANVAS_BACKGROUNDS;
    TASKBAR_CONTEXT.fillRect(startX, 5, 625,40);
    
    TASKBAR_CONTEXT.fillStyle = CANVAS_OUTLINES;
    TASKBAR_CONTEXT.fillText("Status: " + _KernelStatus, startX,20);
    TASKBAR_CONTEXT.fillText("Time:   "  + (new Date().toLocaleString().split("(")[0]), startX,40);

}

/**
 *  Draws a rounded box starting at 0,0 in a canvas.
 * @param context The drawing context for the canvas that a rounded box is needed in.
 * @param rectWidth The width of the rounded box.
 * @param rectHeight The height of the rounded box.
 * @param cornerRadius The radius that all the corners will recieve.
 */
function drawRoundedBox (context, rectWidth, rectHeight, cornerRadius)
{        
    context.save();    
    context.beginPath();
    
    context.moveTo(cornerRadius,0);

    // Top line and top right corner.
    context.arcTo(rectWidth,0,rectWidth,cornerRadius,cornerRadius);

    // Right line and bottom right corner.
    context.arcTo(rectWidth,rectHeight,rectWidth-cornerRadius,rectHeight,cornerRadius); 

    // Bottom line and bottom left corner.
    context.arcTo(0,rectHeight,0,rectHeight-cornerRadius,cornerRadius);

    // Right line and top left corner.
    context.arcTo(0,0,cornerRadius,0,cornerRadius);

    
    context.closePath();    
    context.lineWidth = 3;
    context.fill();
    context.stroke();
     
    context.restore();
}
// This code is not confirmed/tested!
var buttons=[];

function Button ()
{
    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 0;
    this.staticImage = null;
    this.hoverImage = null;
    this.hoverStatus = false;
    this.funct = null;
    this.functToggle = null;
}

Button.prototype.collide = function (posX,posY)
{
    var retVal = false;
    
    if( (posX >= this.x && posX <= this.x + this.width ) &&
        (posY >= this.y && posY <= this.y + this.height) )
    {
        retVal = true;
    }
    
    return retVal;
};

Button.prototype.swapFunct = function () 
{
    var oldFunct = this.funct;
    
    if(this.functToggle)
    {
        this.funct = this.functToggle;
        this.functToggle = oldFunct;
    }
    
    return oldFunct;
};


function checkButtons (event)
{
    for ( var buttonIndex = 0; buttonIndex < buttons.length; buttonIndex ++ )
    {
        if(buttons[buttonIndex].collide(event.layerX, event.layerY))
        {
            buttons[buttonIndex].hoverStatus = true;   
        }
        else
        {
           buttons[buttonIndex].hoverStatus = false;        
        }
    }
}

function drawButton (context, button)
{
    /*TODO get working
    if( button.hoverImage)
    {
        context.drawImage(button.hoverImage, button.x, button.y);
    }
    else
    {
        // Fill in the image rectangle (so the image will appear to change).
        context.drawImage(button.staticImage, button.x, button.y);
    }*/
}

function buttonClick()
{
    for ( var buttonIndex = 0; buttonIndex < buttons.length; buttonIndex ++ )
    {
        if(buttons[buttonIndex].collide(event.layerX, event.layerY))
        {
            buttons[buttonIndex].swapFunct()();
        }
    }    
}

// END UNTESTED CODE!