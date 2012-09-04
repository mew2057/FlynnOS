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
    this.CurrentXPosition = 0;
    this.CurrentYPosition = DEFAULT_FONT_SIZE;
    this.buffer           = new Deque();              // I opted to use a deque to make handling escape characters easier.
    
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
	DRAWING_CONTEXT.clearRect(0, 0, CANVAS.width, CANVAS.height);
}

function consoleWarningScreen(msg)
{
    DRAWING_CONTEXT.fillStyle = "blue"
    DRAWING_CONTEXT.fillRect(0,0,CANVAS.width,CANVAS.height); 
    DRAWING_CONTEXT.fillStyle = "white";
    
    consoleResetXY();
    
    consolePutText(msg);
}

function consoleResetXY()
{
    this.CurrentXPosition = 0;
    this.CurrentYPosition = this.CurrentFontSize;    
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
                if(this.CurrentXPosition + txt.length * this.CurrentFontSize > CANVAS.width)
                {
                    consoleAdvanceLine();
                }
                // Draw the text at the current X and Y coordinates.
                DRAWING_CONTEXT.drawText(this.CurrentFont, this.CurrentFontSize, this.CurrentXPosition, this.CurrentYPosition, txt);
        
                // Move the current X position.
                var offset = DRAWING_CONTEXT.measureText(this.CurrentFont, this.CurrentFontSize, txt);
                this.CurrentXPosition = this.CurrentXPosition + offset;   
        
                added = true;
        }
       
    }
  
    return added;
}

function consoleAdvanceLine()
{
    this.CurrentXPosition = 0;
    this.CurrentYPosition += DEFAULT_FONT_SIZE + FONT_HEIGHT_MARGIN;
    // TODO: Handle scrolling.
}

function consoleBackUpLine()
{
    this.CurrentXPosition = 0;
    this.CurrentYPosition += DEFAULT_FONT_SIZE + FONT_HEIGHT_MARGIN;

}
