//****************Cycle*******************
function Cycle(){} 

Cycle.prototype = {
  currentVector:[0,0],
  direction:0,// 0-E, 1-S, 2-W, 3-N
  velocity:0,
  turningRadius:0,
  color:"blue",
  colorTrail:"blue",
  lastInput:-1,
  alive : true
};

Cycle.translation = [0,0,0]; //Static variable used in translation. X,Y,Z

Cycle.actualPos = function (vector){
    return [vector[0] * Cycle.translation[2] + Cycle.translation[0] ,
        vector[1] * Cycle.translation[2] + Cycle.translation[1]];  
};

Cycle.prototype.update = function ()
{
    if(!this.alive)
    {  
        return;
    }    

    if(this.currentVector[0] % this.turningRadius === 0 &&
        this.currentVector[1] % this.turningRadius === 0)
    {
        if(this.lastInput !== -1 && 
            (this.direction + 2) % 4 !== this.lastInput)
        {
            this.direction = this.lastInput;
        }
        this.lastInput = -1;
       
    }
    
    switch (this.direction)
    {
        case 0:
            this.currentVector[0] -= this.velocity;
            break;
        case 1:
            this.currentVector[1] += this.velocity;
            break;
        case 2:
            this.currentVector[0] += this.velocity;
            break;
        case 3:
            this.currentVector[1] -= this.velocity;
            break;
    }
};

Cycle.prototype.draw = function(context)
{
    if(!this.alive)
    {  
        return;
    }
    
    context.save();
    context.beginPath();
    context.fillStyle = this.color;
    
    var actual = Cycle.actualPos(this.currentVector);
    context.arc(actual[0],actual[1], 4,0,Math.PI*2,false);    
    context.fill();
    context.restore();  
};
//****************************************

//*************Cycle Player***************

function CyclePlayer(){
    this.controls = [0,0,0];    
}

CyclePlayer.prototype = new Cycle();
//****************************************
//*************Cycle Agent****************
//*************Cycle Game*****************


function CycleGame()
{
    this.difficulty = 0; // 0-easy, 1-medium, 2-hard
    this.gameOver = false;
    this.updateDelay = 1/60 * 1000; // Gives 60fps.    
    this.cycles = [];
    this.cellWidth = 0;
    this.upperBound = 0;
    this.leftBound = 0;
    this.stepAmount = 0;
    // I opted for a matrix here, as it is a simple solution and space is not of
    // a dire concern in this issue.
    this.grid = [[],[]];
    this.playerCount = 0;
    
    this.canvas = null;
    this.context = null;
}
CycleGame.ControlSchemes = [ [37,40,39,38], [65,83,68,87]];

CycleGame.prototype.gameLoop = function()
{
    this.update();
    this.draw();
    
    if(!this.gameOver)
    {
        // Apparently for setTimeOut you can't simply send the object function
        // as a call back, but you need to alias this and then 
        // wrap an invocation in an anonymous function...
        var self = this; 

        setTimeout(function(){self.gameLoop();},this.updateDelay);
    }
};

Cycle.prototype.collides = function(cycle)
{
      return this.currentVector[0] === cycle.currentVector[0] &&
        this.currentVector[1] === cycle.currentVector[1];
};

CycleGame.prototype.update = function ()
{ 
    for( var cycle in this.cycles)
    {
        this.cycles[cycle].update(this.context);   
    }
    
    this.collisionDetection();
};

CycleGame.prototype.collisionDetection = function()
{
    // This needs to check the updated states of the other cycles as well.
    var cycleVector;
    for( var cycle in this.cycles)
    {
        cycleVector = [this.cycles[cycle].currentVector[0]/this.stepAmount,
            this.cycles[cycle].currentVector[1]/this.stepAmount];
            
        if(cycleVector[0] % 1 !== 0 ||
            cycleVector[1] % 1 !== 0)
        {
            continue;
        }
        else if(cycleVector[0] > this.grid[0].length-1     ||
                cycleVector[0] <= 0                        ||
                cycleVector[1] > this.grid[1].length -1    ||
                cycleVector[1] <= 0                        ||
                this.grid[cycleVector[0]][cycleVector[1]])
        {
            this.cycles[cycle].alive = false;
            continue;
        }   
        
        this.grid[cycleVector[0]][cycleVector[1]] = cycle;
        
        for( var altCycle in this.cycles)
        {
            if( altCycle != cycle && this.cycles[cycle].collides(
                    this.cycles[altCycle]))
            {
                this.cycles[cycle].alive = false;
            }
        }

    }
    
    
};

    
CycleGame.prototype.draw = function ()
{
    for( var cycle in this.cycles)
    {
        this.cycles[cycle].draw(this.context);   
    }
};

CycleGame.prototype.handleInput = function(event)
{
    for(var index = 0; index < this.cycles.length;index++)
    {
        if(this.cycles[index].controls && 
            this.cycles[index].controls.indexOf(event.which) != -1)
        {
            this.cycles[index].lastInput = this.cycles[index].controls.indexOf(
                event.which);
            return;
        }
    }
    
    if(event.which === 13)
    {
        this.reset(this.difficulty,this.cycles.length, this.playerCount);
    }
};

CycleGame.prototype.setBounds = function(bounds)
{
    
    this.leftBound = bounds[0];
    this.upperBound = bounds[1];
    for(var x =0; x < bounds[3];x++)
    {
        this.grid[x] = [];
        for(var y=0; y<bounds[2];y++)
        {
            this.grid[x].push(null);   
        }
    }
};

CycleGame.prototype.spawnCycle = function(player)
{
    var newCycle = player ? new CyclePlayer() : new Cycle();
    newCycle.velocity = 1;
    newCycle.turningRadius = this.stepAmount;
    
    var startOffset =  1/newCycle.turningRadius;
    
    switch(this.cycles.length)
    {
        case 0:
            newCycle.currentVector = [this.grid[0].length/2,
                this.grid[1].length- 2 + startOffset];
            newCycle.color = "blue";
            newCycle.colorTrail = "#8585FF";
            newCycle.direction = 3;
            break;
        case 1:
            newCycle.currentVector = [this.grid[0].length/2,
                2 - startOffset];
            newCycle.color = "red";
            newCycle.colorTrail ="#FF8585";
            newCycle.direction = 1;
            break;
        case 2:
            newCycle.currentVector = [2 - startOffset,
                this.grid[1].length/2];
            newCycle.color = "yellow";
            newCycle.colorTrail ="#FFFF85";
            newCycle.direction = 2;
            break;
        case 3:
            newCycle.currentVector =[this.grid[0].length-2 + startOffset,
                this.grid[1].length/2];
            newCycle.color = "green";
            newCycle.colorTrail = "#85FF85";

            newCycle.direction = 0;
            break;            
    }

    newCycle.currentVector[0] *= newCycle.turningRadius;
    newCycle.currentVector[1] *= newCycle.turningRadius;
    
    if(player)
    {
        newCycle.controls = CycleGame.ControlSchemes[this.playerCount++];
    }
    
    this.cycles.push(newCycle);    
};

CycleGame.init = function(difficulty, numPlayers, numCycles, canvas)
{
    var cycleGame = new CycleGame();
    
    if(numPlayers.length > 2 || numPlayers < 1)
    {
        //invalid # of players do something.   
        return;
    }
    /*
    
    if(numCycles < 2 && numCycles > 4)
    {
        //Alert this   
        return;
    } */   
    
    if(difficulty < 0 || difficulty > 2)
    {
        return;   
    }    
    
    if(!canvas)
    {
        // Establishes the canvas with an id and a tabindex.
        $('<canvas id="cyclesGameCanvas" tabIndex="0">HTML5 not supported in your browser</canvas>').appendTo('body');
    }
    else
    {
        $(canvas).attr("id","cyclesGameCanvas");
    }
    
   
    
    //Removes the focus border.
    $("#cyclesGameCanvas").css("outline","0");    
    $("#cyclesGameCanvas").focus();

    //$("#cyclesGameCanvas").css("display","none");
    
    // Sets up the canvas and drawing context details for the game.
    cycleGame.canvas = document.getElementById("cyclesGameCanvas");
    cycleGame.canvas.width = 500;
    cycleGame.canvas.height = 500;
    
    // I opt for a keydown event here, because keypressed can result in many issues when 
    // trying to get precision in controlling the cycle.
    $("#cyclesGameCanvas").keydown(function(e){cycleGame.handleInput(e);});

    cycleGame.context = cycleGame.canvas.getContext("2d");    

    cycleGame.reset(difficulty,numCycles, numPlayers);
    
    cycleGame.gameLoop();
};

CycleGame.prototype.reset = function (difficulty,numCycles, numPlayers)
{
    this.cycles = [];
    this.playerCount=0;
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.context.fillStyle = "#02181d";
    this.context.strokeStyle = "#b5ffff";
    //drawRoundedBox(this.context,this.canvas.width, this.canvas.height, 10);
    
    this.cellWidth = 25;
    this.difficulty = difficulty;
    this.setBounds(drawGrid(this.canvas,this.context,this.cellWidth));
    this.stepAmount = 10;
        
    Cycle.translation = [this.upperBound, this.leftBound, this.cellWidth/this.stepAmount];
    
    for(var cycle = 0; cycle < numCycles; cycle ++)
    {
        this.spawnCycle(this.playerCount < numPlayers);
    }
};

//**********************************************

//*************Helper Functions*****************

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

/**
 * Draws the grid that the game will take place on.
 * @param canvas The drawing canvas (contains width and heights).
 * @param context The drawing context of the canvas.
 * @param cellWidth The width of each individual cell in the grid.
 * @return An array of the bounding conditions for the grid [left, top, width, height].
 */
function drawGrid (canvas,context,cellWidth)
{
    var numVerticalIterations = canvas.width/cellWidth - 2;
    var numHorizontalIterations = canvas.height/cellWidth - 2;
    
    var left = cellWidth;
    var top = cellWidth;
    var grad = null;

    
    context.save();

    // The grid elements should have rounded caps.
    context.lineCap = "round";
    context.lineWidth = 1;
    
    context.beginPath();
    
    // Draw a vertical gradient for each vertical line.
    grad = context.createLinearGradient(0,0,0,canvas.height);
    grad.addColorStop(0,'rgba(255,255,255,000)');
    grad.addColorStop(0.5,'rgba(181,255,255,255)');
    grad.addColorStop(1,'rgba(255,255,255,000)');
    context.strokeStyle = grad;
    
    // Draw each line iteratively.
    for(var x =1; x < numVerticalIterations; x++)
    {
        context.moveTo(left + x * cellWidth, top);
        context.lineTo(left + x * cellWidth, top + numHorizontalIterations * cellWidth);
    }
    
    context.stroke();
    context.beginPath();
    
    // Draw a horizontal gradient for each horizontal line.
    grad = context.createLinearGradient(0,0,canvas.width,0);    
    grad.addColorStop(0,'rgba(255,255,255,000)');
    grad.addColorStop(0.5,'rgba(181,255,255,255)');
    grad.addColorStop(1,'rgba(255,255,255,000)');  
    context.strokeStyle = grad;

    // Draw each line iteratively.
    for(var y =1; y < numVerticalIterations; y++)
    {
        context.moveTo(left, top + cellWidth*y);
        context.lineTo(left + numVerticalIterations * cellWidth, top + cellWidth*y);
    }
    
    context.stroke();    
    context.restore();
    
    // This is used to reset the default path and present issues with drawing.
    context.beginPath();
    
    // Create the bounding box that will spell death for all daring enough to crash into it.
    context.strokeRect(left+cellWidth, top+cellWidth,
        (numHorizontalIterations-2) * cellWidth,(numVerticalIterations-2)* cellWidth);
    
    return [left+cellWidth,top+cellWidth,numHorizontalIterations-2,numVerticalIterations-2];
}
//****************************************