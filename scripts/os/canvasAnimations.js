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
    TASKBAR_CANVAS = document.getElementById("taskBar");
    TASKBAR_CONTEXT = TASKBAR_CANVAS.getContext("2d");
    
    // Set the global styles for this context.
    TASKBAR_CONTEXT.fillStyle = CANVAS_BACKGROUNDS;
    TASKBAR_CONTEXT.strokeStyle = CANVAS_OUTLINES;
    TASKBAR_CONTEXT.font = TASKBAR_FONT;    
    
    drawRoundedBox(TASKBAR_CONTEXT,TASKBAR_CANVAS.width,TASKBAR_CANVAS.height,CANVAS_RADIUS);
    
    loadTaskButtons();    
    
    // Add the mouse events.
    var buttonAnimate = function(e){
        var offset= $(e.target).offset();
        
        if (offset)
        {
            checkTaskButtons(e,offset);   
        }
    };
    
    var buttonClick = function(e){
        var offset= $(e.target).offset();
        
        if (offset)
        {
            taskButtonClick(e,offset);
        } 
    };
        
    $("#taskBar").mousedown(buttonClick);    
    $("#taskBar").mousemove(buttonAnimate);
    $("#taskBar").mouseout(buttonAnimate);
   /* $("#taskBar").dblclick(function(e){e.stopPropagation();
        e.preventDefault();});*/
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
 * Loads the buttons for the taskbar. While this is a somewhat circumstantial 
 * function it makes drawtaskbar more readable and easier to follow which is good.
 */
function loadTaskButtons()
{
    var button = null;
    buttons =[];
    
    // Load the power button. When clicked this will either start or halt the OS 
    // and show or hide the "monitor" respectively(opposite of current state).
    button = new Button();    
    button.name = "power";
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
    button.funct = animateStart;
    button.functToggle = animateHalt;
    
    // Push the button to the buttons array.
    buttons.push(button);
    //-------------------------
    
    // Load the refresh button. Reloads the page.
    button = new Button();    
    button.name = "refresh";
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
    
    // Load the halt button.
    // If this button is pressed to restart the os either double click power or reload.
    button = new Button();   
    button.name = "halt";
    button.x = 85;
    button.y = 15;
    button.width = button.height = 25;
    button.context = TASKBAR_CONTEXT;
    
    var haltButton= new Image();
    var haltSelectButton= new Image();
    
    // Ensures the button has a starting image on the load (using the static button).
    haltButton.onload = function() {TASKBAR_CONTEXT.drawImage(haltButton,85,15)}; 
    haltButton.src = "images/halt.png";

    haltSelectButton.onload = function() {};
    haltSelectButton.src = "images/halt_select.png";

    // Set the remaining fields. (functToggle isn't set as it is unnecessary).
    button.hoverImage = haltSelectButton;
    button.staticImage = haltButton;
    button.funct = doHaltAction;
    button.enabled = false;
    
    // Push the button to the buttons array.
    buttons.push(button);    
    //-------------------------   
    
    // Load the step on button.
    button = new Button();   
    button.name = "stepon";
    button.x = 120;
    button.y = 15;
    button.width = button.height = 25;
    button.context = TASKBAR_CONTEXT;
    
    var stepOnButton= new Image();
    var stepOnSelectButton= new Image();
    
    // Ensures the button has a starting image on the load (using the static button).
    stepOnButton.onload = function() {TASKBAR_CONTEXT.drawImage(stepOnButton,120,15)}; 
    stepOnButton.src = "images/step_toggle.png";

    stepOnSelectButton.onload = function() {};
    stepOnSelectButton.src = "images/step_toggle_select.png";

    button.hoverImage = stepOnSelectButton;
    button.staticImage = stepOnButton;
    button.funct = toggleStep; 
    button.enabled = false;
    
    // Push the button to the buttons array.
    buttons.push(button);    
    //-------------------------
    
     // Load the step button.
    button = new Button();   
    button.name = "step";
    button.x = 150;
    button.y = 15;
    button.width = button.height = 25;
    button.context = TASKBAR_CONTEXT;
    
    var stepButton= new Image();
    var stepSelectButton= new Image();
    
    // Ensures the button has a starting image on the load (using the static button).
    stepButton.onload = function() {TASKBAR_CONTEXT.drawImage(stepButton,150,15)}; 
    stepButton.src = "images/step.png";

    stepSelectButton.onload = function() {};
    stepSelectButton.src = "images/step_select.png";

    button.hoverImage = stepSelectButton;
    button.staticImage = stepButton;
    button.funct = stepAction;
    button.enabled = false;
    
    // Push the button to the buttons array.
    buttons.push(button);    
    //-------------------------   
    
}



/**
 * Slides down the console and text boxes and intitates the os.
 */
function animateStart ()
{
    
    $("#display").slideDown(300);
        
    $(".textBox").slideDown(300);
    
    simBtnStartOS_click();
    
    // Enables the halt button. (I'm sure there's a more elegant way).
    for(var index in buttons)
    {
        if ( buttons[index].name == "halt"  || 
            buttons[index].name.indexOf("step") != -1)
        {
            buttons[index].enabled = true;
        }  
    }
}

/**
 * Slides up the console and text boxes and halts the os.
 */
function animateHalt ()
{
    $("#display").slideUp(300);
        
    $(".textBox").slideUp(300);
    
    simBtnHaltOS_click();
    
    // Disables the halt button. (I'm sure there's a more elegant way).
    for(var index in buttons)
    {
        if ( buttons[index].name == "halt"  || 
            buttons[index].name.indexOf("step") != -1)
        {
            buttons[index].enabled = false;
        }  
    }
    
}

/**
 * Trigger when clicking the step button.
 */
function stepAction()
{
    _Step = !_Step;
}

/**
 * Triggers when clicking the step toggle button.
 */
function toggleStep()
{
    _StepEnabled = !_StepEnabled;
    _Step = false;
}

/**
 * Toggles the power button's functionality, disables halt and halts the OS.
 * This function prevents unnecessary animations and makes the ui more intuitive.
 */
function doHaltAction()
{
    for(var index in buttons)
    {
        if( buttons[index].name == "power" )
        {
            buttons[index].swapFunct();
        }
        else if ( buttons[index].name == "halt"  || 
            buttons[index].name.indexOf("step") != -1)
        {
            buttons[index].enabled = false;
        }
    }
    
    simBtnHaltOS_click();
}

/**
 * Changes the colors of non canvas elements.
 */
function changeAllColors(border, background)
{
    $(".textBox").css({"background-color": background});
    $(".textBox").css({"border-color":border});
}

/**
 * A method to be called within the loop of the Operating System that routinely
 * updates and redraws the taskbar's text fields (e.g the status and time).
 */
function updateTaskBar()
{   
    var startX =TASKBAR_CANVAS.width/2.5;
    
    TASKBAR_CONTEXT.fillStyle = CANVAS_BACKGROUNDS;
    TASKBAR_CONTEXT.fillRect(startX-150, 5, 700,40);
    
    TASKBAR_CONTEXT.fillStyle = CANVAS_OUTLINES;
    
    var step =_StepEnabled?"on":"off";
    TASKBAR_CONTEXT.fillText("Step: " + step, startX-150,20);
    
    TASKBAR_CONTEXT.fillText("Status: " + _KernelStatus, startX,20);
    TASKBAR_CONTEXT.fillText("Time:   " + new Date().toLocaleString().split("(")[0], 
        startX, 40);

}
/**
 * Updates the cpu display with the current cpu state.
 * 
 * @param cpu The cpu object that is to be used to update the cpu display.
 */
function updateCPUDisplay(cpu)
{
    $("#accCell").text(padZeros(cpu.Acc.toString(16),2).toUpperCase());
    $("#pcCell").text(padZeros(cpu.PC.toString(16),2).toUpperCase());
    $("#xCell").text(padZeros(cpu.Xreg.toString(16),2).toUpperCase());
    $("#yCell").text(padZeros(cpu.Yreg.toString(16),2).toUpperCase());
    $("#zCell").text(cpu.Zflag.toString(16));
}

/**
 * Initializes the memory display with a memory manager (necessary with the 
 * addition of JQuery tabs).
 * Page MUST be refreshed if you change the page count!
 * 
 * @param memoryManager The accessor to the core memory in the kernel. 
 */
function initMemDisplay(memoryManager)
{
    if(document.getElementById("pages") === null)
    {
        // Set up the unordered list.
        $("#memCell").html('<ul id="pages"></ul>');
        
        // Add the lists and divs for each page.    
        for(var page = 0; page < memoryManager.pageNum; page++)
        {
            $("#pages").append('<li id="page-' + page + '" class="memPageTab"><a class="pageLink" href="#page'+page+'">Page ' + page + '</a></li>');   
            
            $("#memCell").append('<div id="page'+page+'" class="tabBox">'+page+'</div>');
        }
        // set up the tabs then specify the toggle for the tab cycling.
        $("#memCell").tabs();
        $("#pages").append('<li id="autoSwitch" class="memPageTab"><a id="cycleButton" class="toggleButton" href="javascript:toggleCycle()">Cycling</a></li>');   
    }
    
    updateMemDisplay(memoryManager);
}

/**
 * Toggles the cycling of the memory pages (essential in debugging). 
 */
function toggleCycle()
{
    _SwitchPageView = !_SwitchPageView;
    $("#cycleButton").text(_SwitchPageView ? "Cycling" : "Static");
}
/**
 * Updates the memory display with the contents of core memory.
 * 
 * @param memoryManager The memory manager that acts as a delegate to core memory
 *  allowing for controlled data access.
 */
function updateMemDisplay(memoryManager)
{
    // place holder variables.
    var pageDiv = "",table = "";
    
    // Display 10 entries per line and a page of memory per div.
    for (var page =0,lineWidth = 10; page <  memoryManager.pageNum; page ++)
    {            
        pageDiv = "#page"+page;
        
        // Set up the table for the page.
        table ='<table class="pageTable"><tr id="' + 0 +'"><td>0x' + 
            padZeros("0",2).toUpperCase()+ ': </td><td id="'+ 0 +'">' + 
            memoryManager.retrieveFromPage("00",page).toUpperCase() +"</td>";
                    
        // Output the data within the cells.
        for (var index = 1; index < memoryManager.pageSize;index ++)
        {
            // If this index is not the final index output it, 
            // else a table row and memory address needs to be added to the output.
            if( index % lineWidth !== 0)
            {
               table += '<td id="'+index+'">' + memoryManager.retrieveFromPage(
                    index.toString(16),page).toUpperCase() + "</td>";
            }
            else
            {
               table += '</tr><tr id="' + index +'"><td>0x' + padZeros(
                    index.toString(16).toUpperCase(),2) + ':</td><td id="' +
                    index + '">' + memoryManager.retrieveFromPage(
                        index.toString(16),page).toUpperCase() +"</td>";
            }            
        }
        
        // Add the table to the DOM then return.
        $(pageDiv).html(table + "</tr></table>");
        table = "";
    }
}

/**
 * Changes the tab that is presently selected as per the active memory page.
 * 
 * @param page the presently active memory page.
 */
function changeTabDisplay (page)
{
    if(!isNaN(page) && _SwitchPageView)
        $( "#memCell" ).tabs( "option", "selected", page);

}

/**
 * Initializes the display for the process control blocks, uses the JQuery tabs 
 * for a slicker presentation.
 */
function initPCBDisplay()
{
    $("#pcbDiv").tabs();        
    $( "#pcbDiv" ).tabs( "option", "selected", 0);

}

/**
 * Draws the current state of the Proccess Control Blocks in the DOM.
 * I made this somewhat more robust than asked.
 * 
 * @param pcbs The Process Control blocks whose states must be represented in the 
 *  DOM.
 *  0- Residents  (tab 0)
 *  1- Scheduled  (tab 1)
 *  2- Terminated (tab 2)
 *  3- Executing  (tab 1)
 */
function updatePCBDisplay(params)
{
    var head = '<table class="pcbTable"><tr><td>PID</td> <td>PC</td><td>ACC'+
        '</td><td>X</td><td>Y</td><td>Z</td><td>BASE</td><td>LIMIT</td> </tr>';
        
    // Tab 1
    var html = 'Executing<br/>' + head;
    if(params[3])
    {
        html += params[3].toString();
    }
    html += "</table>";
    
    html +='<br/>Ready<br/>' + head +  params[1].toString() + "</table>";
    
    $("#Active").html(html);
    html = "";
    
    // Tab 0
    $("#Residents").html(head + params[0].toString() + "</table>");
    
    // Tab 2    
    $("#Terminated").html(head + params[2].toString() + "</table>");
}

/**
 * A button class that allows for animated images to be used as buttons.
 */
function Button ()
{
    this.name = "";           // The name of the button.
    this.x = 0;               // The x position (of course).
    this.y = 0;               // The y position (of course).
    this.width = 0;           // The width of the button image.
    this.height = 0;          // The height of the button image.
    this.staticImage = null;  // The default image of the button.
    this.hoverImage = null;   // The hover image of the button.
    this.hoverStatus = false; // True when the position of the mouse collides.
    this.funct = null;        // The default function used by the button click.
    this.functToggle = null;  // The optional function for the button click.
    this.enabled = true;      // Unless user specified assume our button is good to go.
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
 * This will only respond if the button is enabled.
 * @param event The event containg the cursor position.
 * @param offset Holds the offset for the mouse clicks.
 */
function checkTaskButtons (event, offset)
{
    var found = false;
    // Iterate over the collection of buttons and cehck for collides.
    // Redraw the button regardless (to emulate focus lost).
    for ( var buttonIndex in buttons )
    {
        if(buttons[buttonIndex].enabled &&
            buttons[buttonIndex].collide(event.pageX -offset.left, 
            event.pageY - offset.top))
        {
            
            buttons[buttonIndex].hoverStatus = true;   
            found = true;
            drawTaskButton(buttons[buttonIndex]);
        }
        else
        {
           buttons[buttonIndex].hoverStatus = false;      
           drawTaskButton(buttons[buttonIndex]);
        }
    }
    
    // This just adds some more visual feedback for the user by changing the pointer appropriately.
    if(found)
    {
        $(event.target).css('cursor', 'pointer');   
    }
    else 
    {
        $(event.target).css('cursor', 'auto'); 
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
 * @param event Holds the mouse position.
 * @param offset Holds the offset for the mouse clicks.
 */
function taskButtonClick(event,offset)
{
    for ( var buttonIndex = 0; buttonIndex < buttons.length; buttonIndex ++ )
    {
        if(buttons[buttonIndex].enabled &&
            buttons[buttonIndex].collide(event.pageX -offset.left, 
            event.pageY - offset.top))
        {
            // Allows for the power button to be on and off.
            buttons[buttonIndex].swapFunct()();
            
            // This provides visual feedback to the user on click.
            buttons[buttonIndex].hoverStatus = false;      
            drawTaskButton(buttons[buttonIndex]);
        }
    }    
}
