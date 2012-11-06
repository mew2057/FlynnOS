// The request animation frame function, for the draw function.
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       || 
          window.webkitRequestAnimationFrame || 
          window.mozRequestAnimationFrame    || 
          window.oRequestAnimationFrame      || 
          window.msRequestAnimationFrame     || 
          function(/* function */ callback, /* DOMElement */ element){
            window.setTimeout(callback, 33);
          };
})();

//****************Cycle*******************
/**
 * Defines the base class for a Cycle agent (player or ai controlled).
 */
function Cycle(){
} 

/**
 * Defines the base components of a cycle agent.
 */
Cycle.prototype = {
    // The current position of the cycle (vector === point in my interpretation). 
    currentVector:[0,0],
    // 0-E, 1-S, 2-W, 3-N
    direction:0,  
    // The current speed of the cycle.
    speed:0, 
    // The number of grid increments per division.
    turningRadius:0,
    // The base color of the cycle.
    color:"blue",
    // The trailing color of the cycle.
    colorTrail:"blue",
    // The last input of the player or AI (maps to the next direction 1 to 1).
    lastInput:-1,
    // The current operational state of the agent.
    alive : true
};

Cycle.translation = [0,0,0]; // Static variable used in translation. X,Y,Z

Cycle.gridPointer = null;    // A pointer to the game grid.

/**
 * Translates the local coordinates of the cycle to the global coordinates of the 
 * canvas.
 * 
 * @param vector The position to be translated.
 * 
 * @return The absolute position of the cycle on the game canvas.
 */
Cycle.actualPos = function (vector){
    return [vector[0] * Cycle.translation[2] + Cycle.translation[0] ,
        vector[1] * Cycle.translation[2] + Cycle.translation[1]];  
};

/**
 * As JavaScript has no super construct (to my knowledge at the time of writing this)
 * I implemented this as a workaround to ensure consistent performance across ai and player
 * agents.
 * 
 * Performs the movement logic for the cycle agent.
 */
Cycle.prototype.updateBase = function ()
{   
    // If we're on a grid intersection point check to see if we should perform a turn.
    if(this.currentVector[0] % this.turningRadius === 0 &&
        this.currentVector[1] % this.turningRadius === 0)
    {
        // If there is an input and the direction isn't "backwards" set the direction to the input.
        if(this.lastInput !== -1 && (this.direction + 2) % 4 !== this.lastInput)
        {
            this.direction = this.lastInput;
        }
        
        this.lastInput = -1;
    }
    
    // Move the cycle.
    switch (this.direction)
    {
        case 0:
            this.currentVector[0] -= this.speed;
            break;
        case 1:
            this.currentVector[1] += this.speed;
            break;
        case 2:
            this.currentVector[0] += this.speed;
            break;
        case 3:
            this.currentVector[1] -= this.speed;
            break;
    }
};

/**
 * Performs the draw operation on the supplied context.
 * Appends to the path for the cycle (a full redraw is not necessary)
 * 
 * @param context The canvas 2d drawing context for the draw operation.
 */
Cycle.prototype.draw = function(context)
{    
    context.save();
    context.beginPath();
    context.fillStyle = this.color;
    
    var actual = Cycle.actualPos(this.currentVector);
    context.arc(actual[0],actual[1], 4,0,Math.PI*2,false);    
    context.fill();
    context.restore();  
};

/**
 * Checks to see if a cycle collides with another cycle.
 * 
 * @param cycle The cycle being checked for collision with the invokig cycle.
 * 
 * @return true if a collision was found, false if not.
 */
Cycle.prototype.collides = function(cycle)
{
      return this.currentVector[0] === cycle.currentVector[0] &&
        this.currentVector[1] === cycle.currentVector[1];
};

//****************************************

//*************Cycle Player***************

/**
 * Defines the Player controlled variant of the Cycle class.
 */
function CyclePlayer(){
    this.controls = [0,0,0,0];    
}

CyclePlayer.prototype = new Cycle();

/**
 * Invokes the parent update routine.
 */
CyclePlayer.prototype.update = function()
{
    this.updateBase();    
};

//****************************************

//*************Cycle Agent****************

/**
 * Defines the AI controlled variant of the Cycle class.
 */
function CycleAgent(){}

CycleAgent.prototype = new Cycle();

/**
 * Introduces the AI component to the update logic.
 */
CycleAgent.prototype.update = function()
{
    this.lookAround();
    
    this.updateBase();    
};

/**
 * This is the Easy mode AI. It only checks values on a straight line and 
 * reacts in a random direction. It looks semi human, but that human is pretty 
 * bad at light cycle games.
 */
CycleAgent.prototype.lookAround = function()
{
    // This is slow, but we only have a maximum of 4 agents so it is managable.
    var x        = Math.ceil(this.currentVector[0]/this.turningRadius);
    var y        = Math.ceil(this.currentVector[1]/this.turningRadius);
    var wallDist = 0;
    
    // Search until a wall is hit.
    while(true)
    { 
        // Increment the distance of the cycle from a wall.
        wallDist++;
        
        // Look in the current direction.
        switch (this.direction)
        {
            case 0:
                x--;
                break;
            case 1:
                y++;
                break;
            case 2:
                x++;
                break;
            case 3:
                y--;
                break;
        }
        
        // Check to see if there is anything in our path, if an opponent cycle was found
        // decrement the wallDist to dignify a greater threat.
        if(!Cycle.gridPointer[x]               ||
            x >= Cycle.gridPointer.length      || x <= 0 ||
            y >= Cycle.gridPointer[x].length   || y <= 0)
        {
            break;   
        }
        else if (Cycle.gridPointer[x][y] !== -1)
        {
            wallDist--;
            break;
        }
        
    }
        
    // If less than or equal to one away turn to avoid (in a random direction...)
    if(wallDist <= 1)
    {
        if(Math.random() > 0.5)
        {
            this.lastInput = (this.direction === 0 ? 4 : this.direction) - 1;
        }
        else
        {
            this.lastInput = (this.direction + 1) % 4;
        } 
    }
};

//*************Cycle Game*****************
/**
 * The class that defines the actual game rules.
 */
function CycleGame()
{
    this.difficulty = 0;    // 0-easy, 1-medium, 2-hard
    this.gameOver = false;  // Self explanatory.
    this.cycles = [];       // The in game agents.
    this.cellWidth = 0;     // The width of one game cell.
    this.upperBound = 0;    // The upper limit of the game grid
    this.leftBound = 0;     // The left limit of the game grid.
    this.stepAmount = 0;    // The number of step per grid.
    
    // I opted for a matrix here, as it is a simple solution and space is not of
    // a dire concern in this issue.
    this.grid = [[]];       // Actually the matrix.
    this.playerCount = 0;   // The number of players on the game grid.
    
    this.canvas = null;     // The gameplay canvas.
    this.context = null;    // The context of the canvas.
}

// The valid control schemes for the player cycle agent.
CycleGame.ControlSchemes = [ [37,40,39,38], [65,83,68,87] ];

// Cycle game "singleton".
CycleGame._Game = null;

/**
 * The game loop for the game, invokes the update and draw routines on the singleton.
 */
CycleGame.gameLoop = function()
{
    CycleGame._Game.update();
    CycleGame._Game.draw();
    
    // This is just good HTML5 game style.
    window.requestAnimFrame(CycleGame.gameLoop);
};

/**
 * Invokes the draw functions of the cycles that are still active.
 */
CycleGame.prototype.draw = function ()
{
    for( var cycle in this.cycles)
    {
        if(this.cycles[cycle].alive)
        {  
            this.cycles[cycle].draw(this.context);  
        }  
    }
};

/**
 * Invokes the update subroutines for the cycles.
 */
CycleGame.prototype.update = function ()
{ 
    for( var cycle in this.cycles)
    {
        // If we have a dead cycle send flowers to the programmer and move along.
        if(this.cycles[cycle].alive)
        {  
            this.cycles[cycle].update(this.context);  
        }         
    }
    
    this.collisionDetection();
};

/**
 * Checks each cycle against itself, the world and other active cycles for collisions.
 */
CycleGame.prototype.collisionDetection = function()
{
    // The grid space position of the cycle.
    var cycleVector;
    
    // Iterates over the collection of cycle agents.
    for( var cycle in this.cycles)
    {
        // Save the translated vector for the cycle in a place holder.
        cycleVector = [this.cycles[cycle].currentVector[0]/this.stepAmount,
            this.cycles[cycle].currentVector[1]/this.stepAmount];
            
        // If it isn't on a grid line we don't need a colision check.
        // Else check the cycle against the world boundaries and kill it if a collision is found.
        if(cycleVector[0] % 1 !== 0 ||
            cycleVector[1] % 1 !== 0)
        {
            continue;
        }
        else if(cycleVector[0] > this.grid[0].length-1     ||
                cycleVector[0] <= 0                        ||
                cycleVector[1] > this.grid[1].length -1    ||
                cycleVector[1] <= 0                        ||
                this.grid[cycleVector[0]][cycleVector[1]] != -1)
        {
            this.cycles[cycle].alive = false;
            continue;
        } 
        
        // If the cycle makes it here it has earned the right to be represented on the grid (through its index).
        this.grid[cycleVector[0]][cycleVector[1]] = cycle;
        
        // Check the cycle against the other cycles on the map.
        for( var altCycle in this.cycles)
        {
            if( altCycle != cycle && this.cycles[cycle].collides(
                    this.cycles[altCycle]))
            {
                this.cycles[cycle].alive = false;
                break;
            }
        }
    }  
};

/**
 * Acts as the controller for the playing character cycle agents.
 */
CycleGame.prototype.handleInput = function(event)
{
    event.stopPropagation();
    event.preventDefault();
    
    // Checks to see if any of the currently active cycles respond to the input.
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
    
    // Enter resets the game.
    if(event.which === 13)
    {
        this.reset(this.difficulty,this.cycles.length, this.playerCount);
    }
};

/**
 * Sets the game boundaries, initialize the grid and give the Cycle class a reference.
 * 
 * @param bounds 0 - left bound
 *               1 - upper bound
 *               2 - rows
 *               3 - columns
 */
CycleGame.prototype.setBounds = function(bounds)
{
    
    this.leftBound = bounds[0];
    this.upperBound = bounds[1];
    
    for(var x =0; x < bounds[3];x++)
    {
        this.grid[x] = [];
        for(var y=0; y<bounds[2];y++)
        {
            this.grid[x].push(-1);   
        }
    }
    
    //Set the grid pointer for cycle operations.
    Cycle.gridPointer = this.grid;
};

/**
 * Spawns a new AI or player controlled cycle agent.
 * 
 * Cycles are spawned in a given oreder with set colors based on player numbers:
 * Cycle 0: Blue   Bottom
 * Cycle 1: Red    Top
 * Cycle 2: Yellow Left
 * Cycle 3: Green  Right
 * 
 * @param player A boolean flag that defines whether the cycle is a player or not.
 */
CycleGame.prototype.spawnCycle = function(player)
{
    // Determine the type of cycles.
    var newCycle = player ? new CyclePlayer() : new CycleAgent();
    
    // Set the speed of the light cycle and make the turning radius equivalent to grid steps.
    newCycle.speed = 1;
    newCycle.turningRadius = this.stepAmount;
    
    // Place the cycle a lttle behind it's starting line so collision can run right.
    var startOffset =  1/newCycle.turningRadius;
    
    // build the cycles.
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

    // Convert the grid vector values to the actual vector values for drawing.
    newCycle.currentVector[0] *= newCycle.turningRadius;
    newCycle.currentVector[1] *= newCycle.turningRadius;
    
    // Assign a control scheme the cycle if necessary and available.
    if(player)
    {
        newCycle.controls = CycleGame.ControlSchemes[this.playerCount++];
    }
    
    // Add the cycle to the cycle list.
    this.cycles.push(newCycle);    
};

/**
 * Initializes the game.
 * @param dificulty  0 - easy
 *                   1 - medium
 *                   2 - hard
 * @param numPlayers 0 - 2 defines number of players.
 * @param numCycles  2 - 4 defines number of cycles.
 * @param canvas     The cycle game cavas (if not specified the game will make its own.
 */
CycleGame.init = function(difficulty, numPlayers, numCycles, canvas)
{
    CycleGame._Game = new CycleGame();
    
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
    
    // Sets up the canvas and drawing context details for the game.
    CycleGame._Game.canvas = document.getElementById("cyclesGameCanvas");
    CycleGame._Game.canvas.width = 500;
    CycleGame._Game.canvas.height = 500;
    
    // I opt for a keydown event here, because keypressed can result in many issues when 
    // trying to get precision in controlling the cycle.
    $("#cyclesGameCanvas").keydown(function(e){CycleGame._Game.handleInput(e);});

    CycleGame._Game.context = CycleGame._Game.canvas.getContext("2d");    

    CycleGame._Game.reset(difficulty, numCycles, numPlayers);
    
    // This lets the post intialization garbage collection run and prevents the initial stutter.
    setTimeout(function() {
        CycleGame.gameLoop();
    }, 100);
};

/**
 *  Resets the game state with the supplied details.
 *  @param dificulty  0 - easy
 *                   1 - medium
 *                   2 - hard
 * @param numPlayers 0 - 2 defines number of players.
 * @param numCycles  2 - 4 defines number of cycles.
 */
CycleGame.prototype.reset = function (difficulty,numCycles, numPlayers)
{
    this.cycles = [];
    this.playerCount=0;
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.context.fillStyle = "#02181d";
    this.context.strokeStyle = "#b5ffff";
    
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