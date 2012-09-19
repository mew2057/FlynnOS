/* ------------
   Console.js

   Requires globals.js, deque.js, canvasAnimations.js

   The OS Console - stdIn and stdOut by default.
   Note: This is not the Shell.  The Shell is the "command line interface" (CLI)
   or interpreter for this console.
   My console doesn't go to the bottom of the border, preventing border clobbering.
   ------------ */

function Console()
{
    // Properties
    this.CurrentFont      = DEFAULT_FONT;
    this.CurrentFontSize  = DEFAULT_FONT_SIZE;
    this.CurrentXPosition = CANVAS_OFFSET;
    this.CurrentYPosition = DEFAULT_FONT_SIZE 
                          + CANVAS_BASE_Y_OFFSET;     // The addition of the offset prevents overlap with the border.                          
    this.buffer           = new Deque();               // I opted to use a deque to make handling backspace simpler.
    this.lineEndings      = new Deque();               // This is to keep track of the ending x position of a line in input
                                                       // to make cross line deletion simpler.
    
    // Methods 
    this.init          = consoleInit;
    this.clearScreen   = consoleClearScreen;
    this.resetXY       = consoleResetXY;
    this.handleInput   = consoleHandleInput;
    this.putText       = consolePutText;
    this.advanceLine   = consoleAdvanceLine;
    this.backUpLine    = consoleBackUpLine;
    this.trapScreen    = consoleTrapScreen;
    this.splitToken    = consoleSplitToken;
    
}

/**
 * The console initializer.
 */
function consoleInit()
{
    consoleClearScreen();
    consoleResetXY();
    //Ensures the aesthetic is constant.
    changeAllColors(CANVAS_OUTLINES,CANVAS_BACKGROUNDS); 
}

/**
 * Redraws the console as a blank slate (with rounded edges in this case. 
 */
function consoleClearScreen()
{
    drawRoundedBox(DRAWING_CONTEXT, CANVAS.width,CANVAS.height,CANVAS_RADIUS);
}

/**
 * Displays A message specified by the invoking method (generally an os trap)
 * While changing the color of the screen.
 */
function consoleTrapScreen(msg)
{
    DRAWING_CONTEXT.save();
    
    DRAWING_CONTEXT.fillStyle = CANVAS_TRAP_BACKGROUNDS;
    DRAWING_CONTEXT.strokeStyle = CANVAS_TRAP_OUTLINES;
    
    // This redraws the box in orange (color set in globals.js).
    drawRoundedBox(DRAWING_CONTEXT,CANVAS.width,CANVAS.height,CANVAS_RADIUS);
    
    changeAllColors(CANVAS_TRAP_OUTLINES,CANVAS_TRAP_BACKGROUNDS);
    
    this.resetXY();
    this.putText(msg);

    DRAWING_CONTEXT.restore();

}

/**
 *  Resets the current X and Y to the default offsets. 
 */
function consoleResetXY()
{
    this.CurrentXPosition = CANVAS_OFFSET;
    this.CurrentYPosition = this.CurrentFontSize + CANVAS_BASE_Y_OFFSET;
}

/**
 * Updates the console with the latest input from the kernel input queue.
 * Maintains the console buffer and lineEndings.
 */
function consoleHandleInput()
{
    while (_KernelInputQueue.getSize() > 0)
    {
        // Get the next character from the kernel input queue.
        var chr = _KernelInputQueue.dequeue();
                
        // Check to see if it's "special" (enter or ctrl-c) or "normal" (anything else that the keyboard device driver gave us).
        if (chr == String.fromCharCode(13))  //     Enter key   
        {
            // The enter key marks the end of a console command, so ...
            // ... tell the shell ... 
            _OsShell.handleInput(this.buffer.toString());
            // ... and reset our buffers.
            this.buffer = new Deque();
            this.lineEndings = new Deque();
        }
        // TODO: Write a case for Ctrl-C.
        else
        {
            // This is a "normal" character, so ...
            // ... draw it on the screen...
            if( this.putText(chr,true) ) {
                // ...If the character wasn't an escape character add it to the buffer.
                this.buffer.pushBack(chr);
            }
        }
    }
}
/**
 * Outputs text to the console and returns whether anything was sucessfully added 
 * to the console.
 * 
 * @param txt The string or char that will be added to the console.
 * @param input An optional field that specifies that the text came from input if
 *              true.
 * 
 * @return True If the console actually added text (\b returns false) (used in input).
 */
function consolePutText(txt, input)    
{
    
    var added = false;
    
    // My first inclination here was to write two functions: putChar() and putString().
    // Then I remembered that Javascript is (sadly) untyped and it won't differentiate 
    // between the two.  So rather than be like PHP and write two (or more) functions that
    // do the same thing, thereby encouraging confusion and decreasing readability, I 
    // decided to write one function and use the term "text" to connote string or char.
    if (txt != "")
    {
        switch (txt)
        {
            case "\b":
                
                // This prevents null pointer exceptions.
                if(this.buffer.getSize() == 0)
                {
                    break;   
                }
                
                txt = this.buffer.popBack();

                // Move the current X position.
                var offset = DRAWING_CONTEXT.measureText(DEFAULT_FONT, 
                    DEFAULT_FONT_SIZE,txt);     
                    
                this.CurrentXPosition = this.CurrentXPosition - offset;    
                
                // Erase the text supplied (typically one character).
                DRAWING_CONTEXT.eraseText(this.CurrentFont, this.CurrentFontSize, 
                    this.CurrentXPosition, this.CurrentYPosition, txt);
                
                // This code handles backspace when the type is on the second line. 
                // The plus 1 handles a bounding condition.
                if(this.CurrentXPosition <= CANVAS_OFFSET + 1)
                {
                    this.backUpLine();
                }

                break;
                
            // I origianlly had a way more complex way to handle this but then I
            // remembered Kernighan’s Law.
            case " ":
                offset =  DRAWING_CONTEXT.measureText(DEFAULT_FONT, 
                    DEFAULT_FONT_SIZE," ");
                
                if(this.CurrentXPosition + offset > CANVAS.width - CANVAS_OFFSET)
                {
                    this.advanceLine(input);
                }
                
                this.CurrentXPosition = this.CurrentXPosition + offset;                   
                    
                added = true;
                
                break;               
            
            default:
                // I split the string into tokens, as it makes it easier to handle 
                // wraparound.I apply a toString for bound conditions that I 
                // encountered while coding project 2. (wraparound comment 
                // somewhat intended)
                var tokens = txt.toString().split(" ");    

                var offsetLength = 0;
                if(tokens.length > 1)
                {
                    offsetLength = DRAWING_CONTEXT.measureText(DEFAULT_FONT, 
                        DEFAULT_FONT_SIZE," ");
                }
                                
                var offset = 0;
                
                for (var index in tokens)
                {
                    
                    offset = DRAWING_CONTEXT.measureText(DEFAULT_FONT, 
                        DEFAULT_FONT_SIZE,tokens[index]);

                    // If the the offset plus the current position 
                    // exceeds the available line width and the offset alone
                    // doesn't just advance the line.
                    if(this.CurrentXPosition + offset > CANVAS.width - CANVAS_OFFSET &&
                        offset < CANVAS.width - CANVAS_OFFSET)
                    {
                        this.advanceLine(input);
                    }                    
                    // Else if the offset is too long wraparound using characters.
                    else if (offset > CANVAS.width - CANVAS_OFFSET)
                    {
                        // It's a fair assumption that this isn't user input 
                        // (since we handle user input by the character).
                        this.splitToken(tokens[index]);     
                        continue; 
                    }
                  
                     // Draw the text at the current X and Y coordinates.
                    DRAWING_CONTEXT.drawText(this.CurrentFont, this.CurrentFontSize, 
                        this.CurrentXPosition, this.CurrentYPosition, tokens[index]);
                
                    // Move the current X position.                    
                    this.CurrentXPosition = this.CurrentXPosition + offset + offsetLength ;   
                        
            }
            added = true;           
        }
    }
  
    return added;
}

/**
 * Splits a supplied token into a character array and prints each character on 
 * the console (Handles a special case of wrap around). Assumes that this 
 * doesn't originate from user input.
 * @param token The token to split and output.
 */
function consoleSplitToken(token)
{    
    var chars = token.split("");
    
    for (var index in chars)
    {
       this.putText(chars[index]);
    }    
}

/**
 * Advances the line and sets the current x and y as needed. If at the bottom 
 * of the output scrolls.
 * @param input specifies whether or not this is an input driven line advance.
 */
function consoleAdvanceLine(input)
{
    // Save the ending position of the line in case the user wants to backspace 
    // to the current line. (hard to calculate)
    if(input)
    {
        this.lineEndings.pushBack(this.CurrentXPosition);   
    }
    
    this.CurrentXPosition = CANVAS_OFFSET;
    
    // If the current prompt is 3 lines from the base of the console do a shift.
    if(this.CurrentYPosition >= CANVAS.height - 3 * 
        (DEFAULT_FONT_SIZE + FONT_HEIGHT_MARGIN))
    {                                
        // Minus 1 to catch any outliers.
        var imgX = CANVAS_OFFSET - 1 
        
        // Calculate the starting Y of the second line.
        var imgY = DEFAULT_FONT_SIZE + CANVAS_BASE_Y_OFFSET + FONT_HEIGHT_MARGIN;
        
        // Calculate the actual text width accounting for offsets.
        var imgWidth = CANVAS.width - 2 * CANVAS_OFFSET;
        
        //Calculate the the total height of the copyable canvas.
        var imgHeight= CANVAS.height - 3 * CANVAS_OFFSET;
        
        var image = DRAWING_CONTEXT.getImageData(imgX, imgY,imgWidth,imgHeight );   

        // Shifts the console up one line.
        DRAWING_CONTEXT.putImageData(image, imgX, CANVAS_BASE_Y_OFFSET);
    }
    else
    {
        this.CurrentYPosition += DEFAULT_FONT_SIZE +FONT_HEIGHT_MARGIN;
    }
}

/**
 * Places the cursor at the end of the previous line.
 */
function consoleBackUpLine()
{
    // Pop the back of the line ending Deque to set up the 
    this.CurrentXPosition = this.lineEndings.popBack();        
    this.CurrentYPosition -= (DEFAULT_FONT_SIZE + FONT_HEIGHT_MARGIN);
}
