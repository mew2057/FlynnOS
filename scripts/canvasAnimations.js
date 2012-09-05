/*  --------------
    canvasAnimations.js
    
    This class handles drawing canvas shapes on the frontend.
     In focusing these methods into this file I can reduce the clutter
     in my os code scripts and better separate view code from model code.
   
    Useful Resources:    
     http://www.html5canvastutorials.com/
    -------------- */

var buttons=[];     // The buttons on the taskbar.

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
    button.context = TASKBAR_CONTEXT;

    var powerButton=new Image();
    var powerSelectButton=new Image();

    // Ensures the button has a starting image on the load (using the static button).
    powerButton.onload = function() {TASKBAR_CONTEXT.drawImage(powerButton,15,15)};
    powerButton.src = "images/power.png";
    
    powerSelectButton.onload = function() {};
    powerSelectButton.src = "images/power_select.png";
    

    // Set the remaining fields.
    button.hoverImage = powerSelectButton;
    button.staticImage = powerButton;
    button.funct = simBtnStartOS_click;
    button.functToggle = simBtnHaltOS_click;
    
    // Push the button to the buttons array.
    buttons.push(button);
    //-------------------------
    
    // Load the refresh button.
    button = new Button();     
    button.x = 50;
    button.y = 15;
    button.width = button.height = 25;
    button.context = TASKBAR_CONTEXT;
    
    var refreshButton= new Image();
    var refreshSelectButton= new Image();
    
    // Ensures the button has a starting image on the load (using the static button).
    refreshButton.onload = function() {TASKBAR_CONTEXT.drawImage(refreshButton,50,15)}; 
    refreshButton.src = "images/refresh.png";

    refreshSelectButton.onload = function() {};
    refreshSelectButton.src = "images/refresh_select.png";

    // Set the remaining fields. (functToggle isn't set as it is unnecessary).
    button.hoverImage = refreshSelectButton;
    button.staticImage = refreshButton;
    button.funct = simBtnReset_click;

    // Push the button to the buttons array.
    buttons.push(button);
    //-------------------------
    
    // Add the mouse events.
    TASKBAR_CANVAS.addEventListener('mousemove',checkTaskButtons,false);
    TASKBAR_CANVAS.addEventListener('mousedown',taskButtonClick,false);
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


/**
 * A button class that allows for animated images to be used as buttons.
 */
function Button ()
{
    this.x = 0;               // The x position (of course).
    this.y = 0;               // The y position (of course).
    this.width = 0;           // The width of the button image.
    this.height = 0;          // The height of the button image.
    this.staticImage = null;  // The default image of the button.
    this.hoverImage = null;   // The hover image of the button.
    this.hoverStatus = false; // True when the position of the mouse collides.
    this.funct = null;        // The default function used by the button click.
    this.functToggle = null;  // The optional function for the button click.
}

/**
 * Checks to see if an (X,Y) coordinate collides with the bounding box of the
 * button.
 * @param posX The x coordinate.
 * @param posY The y coordinate.
 * @return true If a collision is found.
 */
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

/**
 * Swaps the method invoked by the button (if possible).
 * @return A pointer to old funct field before the swap was attempted.
 */
Button.prototype.swapFunct = function () 
{
    var oldFunct = this.funct;
    
    // If the toggled function is truthy we can swap functions.
    // The old funct is safely tucked away for returning.
    if(this.functToggle)
    {
        this.funct = this.functToggle;
        this.functToggle = oldFunct;
    }
    
    return oldFunct;
};


/**
 * Checks the mouse position to see if it collides with one for the task buttons. 
 * @param event The event containg the cursor position.
 */
function checkTaskButtons (event)
{
    // Iterate over the collection of buttons and cehck for collides.
    // Redraw the button regardless (to emulate focus lost).
    for ( var buttonIndex in buttons )
    {
        if(buttons[buttonIndex].collide(event.layerX, event.layerY))
        {
            buttons[buttonIndex].hoverStatus = true;   
            drawTaskButton(buttons[buttonIndex]);
        }
        else
        {
           buttons[buttonIndex].hoverStatus = false;      
           drawTaskButton(buttons[buttonIndex]);
        }
    }
}

/**
 * Redraws the button supplied according to its hover state.
 * @param button The button to be redrawn.
 */
function drawTaskButton (button)
{
    // Save the context (just good canvas style) and then swap the fill.
    TASKBAR_CONTEXT.save();    
    TASKBAR_CONTEXT.fillStyle = CANVAS_BACKGROUNDS;
    
    
    // For both fill the button space, then draw the new button image.
    if( button.hoverStatus)
    {
        TASKBAR_CONTEXT.fillRect(button.x,button.y, button.width,button.height);
        TASKBAR_CONTEXT.drawImage(button.hoverImage, button.x, button.y);
    }
    else
    {
        TASKBAR_CONTEXT.fillRect(button.x,button.y, button.width,button.height);
        TASKBAR_CONTEXT.drawImage(button.staticImage, button.x, button.y);
    }
    
    TASKBAR_CONTEXT.restore();
}

/**
 * Checks to see which button (if any) should be triggered by the mouse down 
 * event in the taskbar.
 */
function taskButtonClick(event)
{
    for ( var buttonIndex = 0; buttonIndex < buttons.length; buttonIndex ++ )
    {
        if(buttons[buttonIndex].collide(event.layerX, event.layerY))
        {
            // Allows for the power button to be on and off.
            buttons[buttonIndex].swapFunct()();
            
            // This provides visual feedback to the user on click.
            buttons[buttonIndex].hoverStatus = false;      
            drawTaskButton(buttons[buttonIndex]);
        }
    }    
}
