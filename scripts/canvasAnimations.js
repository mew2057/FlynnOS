var canvasBackgrounds = "#02181d";
var canvasOutlines = "#b5ffff";

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
    if( button.hoverImage)
    {
        context.fillRect(button.x,button.y,button.width,button.height); 
        context.drawImage(button.hoverImage, button.x, button.y);
    }
    else
    {
        // Fill in the image rectangle (so the image will appear to change).
        context.fillRect(button.x,button.y,button.width,button.height); 
        context.drawImage(button.staticImage, button.x, button.y);
    }
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

/*
    http://www.html5canvastutorials.com/
*/
function canvasInit()
{
    drawTaskBar();
    
    //setInterval(drawCanvas(),40);
}


// Does the initial draw of the task bar and buttons.
function drawTaskBar ()
{
    var rectWidth = 1250;
    var rectHeight = 50;
    var rectX = 15;
    var rectY = 15;
    var radius = 15;
    var button = null;
    
    TASKBAR_CANVAS = document.getElementById("taskBar");
    
    TASKBAR_CONTEXT = TASKBAR_CANVAS.getContext("2d");
    
    // Set the taskbar font.
    TASKBAR_CONTEXT.font = TASKBAR_FONT;

    
    
    drawRoundedBox(TASKBAR_CONTEXT,rectWidth,rectHeight,rectX,rectY,radius);
    
    // Load the power button.
    button = new Button();    
    button.x = 30;
    button.y = 25;
    button.width = button.height = 25;
    
    var powerButton=new Image();
    var powerSelectButton=new Image();

    powerButton.onload = function() {TASKBAR_CONTEXT.drawImage(powerButton,30,25)};
    
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
    
    // Load the refresh buttons.
    button = new Button();     
    button.x = 70;
    button.y = 25;
    button.width = button.height = 25;
    
    var refreshButton= new Image();
    var refreshSelectButton= new Image();
    
    refreshButton.onload = function() {TASKBAR_CONTEXT.drawImage(refreshButton,70,25)};
    refreshButton.src = "images/refresh.png";

    refreshSelectButton.onload = function() {};
    refreshSelectButton.src = "images/refresh_select.png";

  
    button.hoverImage = refreshSelectButton;
    button.staticImage = refreshButton;
    button.funct = simBtnReset_click;
    
    drawButton(TASKBAR_CONTEXT, button);
   
    buttons.push(button);
    
    //-------------------------

    updateTaskBar();
    TASKBAR_CANVAS.addEventListener('mousemove',checkButtons,false);
    TASKBAR_CANVAS.addEventListener('mousedown',buttonClick,false);

}

function updateTaskBar()
{
    
    var startX =TASKBAR_CANVAS.width/2.5;
    
    TASKBAR_CONTEXT.fillStyle = canvasBackgrounds;
    TASKBAR_CONTEXT.fillRect(startX, 20, 625,40);
    
    TASKBAR_CONTEXT.fillStyle = canvasOutlines;
    TASKBAR_CONTEXT.fillText("Status: " + _KernelStatus, startX,35);
    TASKBAR_CONTEXT.fillText("Time:   "  + (new Date().toLocaleString().split("(")[0]), startX,55);

}

function drawRoundedBox (context, rectWidth, rectHeight, rectX, rectY, cornerRadius)
{    
    context.fillStyle = canvasBackgrounds;
    context.strokeStyle = canvasOutlines;
    
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
    context.lineWidth = 3;
    context.fill();
    context.stroke();
    
 
    context.restore();
}
