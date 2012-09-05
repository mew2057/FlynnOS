/* ------------
   Console.js

   Requires globals.js

   The OS Console - stdIn and stdOut by default.
   Note: This is not the Shell.  The Shell is the "command line interface" (CLI) or interpreter for this console.
   ------------ */

function Console()
{
    // Properties
    this.CurrentFont      = DEFAULT_FONT;
    this.CurrentFontSize  = DEFAULT_FONT_SIZE;
    this.CurrentXPosition = CANVAS_OFFSET;
    this.CurrentYPosition = DEFAULT_FONT_SIZE 
                          + CONSOLE_BASE_Y_OFFSET;     // The addition of the offset prevents overlap with the border.                          
    this.buffer           = new Deque();            // I opted to use a deque to make handling escape characters easier.
    
    // Methods
    this.init          = consoleInit;
    this.clearScreen   = consoleClearScreen;
    this.resetXY       = consoleResetXY;
    this.handleInput   = consoleHandleInput;
    this.putText       = consolePutText;
    this.advanceLine   = consoleAdvanceLine;
    this.warningScreen = consoleWarningScreen;
}

function consoleInit()
{
    consoleClearScreen();
    consoleResetXY();
}

function consoleClearScreen()
{
    drawRoundedBox(DRAWING_CONTEXT, CANVAS.width,CANVAS.height,CANVAS_RADIUS);

}

function consoleWarningScreen(msg)
{
    DRAWING_CONTEXT.save();
    
    DRAWING_CONTEXT.fillStyle = CANVAS_TRAP_BACKGROUNDS;
    DRAWING_CONTEXT.strokeStyle = CANVAS_TRAP_OUTLINES;
    
    drawRoundedBox(DRAWING_CONTEXT,CANVAS.width,CANVAS.height,CANVAS_RADIUS);
    
    this.resetXY();
    this.putText(msg);

    DRAWING_CONTEXT.restore();

}

function consoleResetXY()
{
    this.CurrentXPosition = CANVAS_OFFSET;
    this.CurrentYPosition = this.CurrentFontSize + CONSOLE_BASE_Y_OFFSET;
}

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
            // ... and reset our buffer.
            this.buffer = new Deque();
        }
        // TODO: Write a case for Ctrl-C.
        else
        {
            // This is a "normal" character, so ...
            // ... draw it on the screen...
            if( this.putText(chr) ) {
                // ...If the character wasn't an escape character add it to the buffer.
                this.buffer.pushBack(chr);
            }
        }
    }
}

function consolePutText(txt)    
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
                txt = this.buffer.popBack();

                // Move the current X position.
                var offset = DRAWING_CONTEXT.measureText(this.CurrentFont, this.CurrentFontSize, txt);
                            
                this.CurrentXPosition = this.CurrentXPosition - offset;    
        
                // Erase the text at the current X and Y coordinates and one before.
                DRAWING_CONTEXT.eraseText(this.CurrentFont, this.CurrentFontSize, this.CurrentXPosition, this.CurrentYPosition, txt);
                break;
            
            default:
                //I split the string into tokens, as it makes it trival to handle newline                
                var tokens = txt.split(" ");    
                
                var offsetChar = tokens.length > 1 ? ' ':'' // If we have a string each token should be assumed to have a space at the end.
                
                var offsetLength = DRAWING_CONTEXT.measureText(this.CurrentFont, this.CurrentFontSize, offsetChar);
                
                var offset = 0;
                
                for (var index in tokens)
                {
                    offset = DRAWING_CONTEXT.measureText(this.CurrentFont, this.CurrentFontSize, tokens[index]);
                    
                    if(this.CurrentXPosition + offset > CANVAS.width - CANVAS_OFFSET)
                    {
                        this.advanceLine();
                    }
                    
                     // Draw the text at the current X and Y coordinates.
                    DRAWING_CONTEXT.drawText(this.CurrentFont, this.CurrentFontSize, this.CurrentXPosition, this.CurrentYPosition, tokens[index]);
            
                    // Move the current X position.                    
                    this.CurrentXPosition = this.CurrentXPosition + offset + offsetLength;   
        
                }

                added = true;           
        }
    }
  
    return added;
}

function consoleAdvanceLine()
{
    this.CurrentXPosition = CANVAS_OFFSET;

    
    if(this.CurrentYPosition > CANVAS.height -CONSOLE_MIN_HEIGHT)
    {
        // XXX This is a cluster you know what. I'm working on standardizing things, and this is just a rough in.
        var image = DRAWING_CONTEXT.getImageData(CANVAS_OFFSET, 
                                                CONSOLE_BASE_Y_OFFSET + DEFAULT_FONT_SIZE + FONT_HEIGHT_MARGIN,
                                                CANVAS.width - 2* CANVAS_OFFSET,
                                                CANVAS.height - 2* (CONSOLE_BASE_Y_OFFSET + DEFAULT_FONT_SIZE));
                                                
        DRAWING_CONTEXT.putImageData(image,CANVAS_OFFSET,CONSOLE_BASE_Y_OFFSET);
        
   
    }
    else
    {
            this.CurrentYPosition += DEFAULT_FONT_SIZE + FONT_HEIGHT_MARGIN;

    }
}
