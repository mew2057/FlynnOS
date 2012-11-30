/* ------------
   Shell.js
   
   The OS Shell - The "command line interface" (CLI) or interpreter for the console.
   Whenever possible the shell quotes the Master Control Program at you.
   ------------ */

// TODO: Write a base class / prototype for system services and let Shell inherit from it.

function Shell()
{
    // Properties
    this.promptStr     = ">";
    this.commandList   = [];
    this.curses        = "[fuvg],[cvff],[shpx],[phag],[pbpxfhpxre],[zbgureshpxre],[gvgf]";
    this.apologies     = "[sorry]";
    
    
    // Methods
    this.init        = shellInit;
    this.putPrompt   = shellPutPrompt;
    this.handleInput = shellHandleInput;
    this.execute     = shellExecute;
    this.drop        = shellDropLine;
}

function shellInit()
{
    var sc = null;
    //
    // Load the command list.

    // ver
    sc = new ShellCommand();
    sc.command = "ver";
    sc.description = "- Displays the current version data.";
    sc.funct = shellVer;
    this.commandList[this.commandList.length] = sc;
    
    // help
    sc = new ShellCommand();
    sc.command = "help";
    sc.description = "- This is the help command. Seek help.";
    sc.funct = shellHelp;
    this.commandList[this.commandList.length] = sc;
    
    // shutdown
    sc = new ShellCommand();
    sc.command = "shutdown";
    sc.description = "- Shuts down the virtual OS but leaves the underlying"
        + " hardware simulation running.";
    sc.funct = shellShutdown;
    this.commandList[this.commandList.length] = sc;

    // cls
    sc = new ShellCommand();
    sc.command = "cls";
    sc.description = "- Clears the screen and resets the cursosr position.";
    sc.funct = shellCls;
    this.commandList[this.commandList.length] = sc;

    // man <topic>
    sc = new ShellCommand();
    sc.command = "man";
    sc.description = "<topic> - Displays the MANual page for <topic>.";
    sc.funct = shellMan;
    this.commandList[this.commandList.length] = sc;
    
    // trace <on | off>
    sc = new ShellCommand();
    sc.command = "trace";
    sc.description = "<on | off> - Turns the OS trace on or off.";
    sc.funct = shellTrace;
    this.commandList[this.commandList.length] = sc;

    // rot13 <string>
    sc = new ShellCommand();
    sc.command = "rot13";
    sc.description = "<string> - Does rot13 obfuscation on <string>.";
    sc.funct = shellRot13;
    this.commandList[this.commandList.length] = sc;

    // prompt <string>
    sc = new ShellCommand();
    sc.command = "prompt";
    sc.description = "<string> - Sets the prompt.";
    sc.funct = shellPrompt;
    this.commandList[this.commandList.length] = sc;

    // processes - list the running processes and their IDs
    // kill <id> - kills the specified process id.

    sc = new ShellCommand();
    sc.command = "whoami";
    sc.description = "- Displays the current User Name.";
    sc.funct = shellWhoAmI;
    this.commandList[this.commandList.length] = sc;
    
    sc = new ShellCommand();
    sc.command = "whereami";
    sc.description = "- Displays current user location.";
    sc.funct = shellWhereAmI;
    this.commandList[this.commandList.length] = sc;

    sc = new ShellCommand();
    sc.command = "date";
    sc.description = "- Displays the current date and time.";
    sc.funct = shellDate;
    this.commandList[this.commandList.length]=sc;
    
    sc = new ShellCommand();
    sc.command = "status";
    sc.description = "<string>- Sets the current kernel status.";
    sc.funct = shellStatus;
    this.commandList[this.commandList.length]=sc;
    
    sc = new ShellCommand();
    sc.command = "load";
    sc.description = " - Loads the contents of the program box.";
    sc.funct = shellLoad;
    this.commandList[this.commandList.length]=sc;
    
    sc = new ShellCommand();
    sc.command = "osod";
    sc.description = " - Anger the MCP.";
    sc.funct = shellOSOD;
    this.commandList[this.commandList.length]=sc;

    sc = new ShellCommand();
    sc.command ="bit";
    sc.description = " <string> - Recieve sage advice from Bit.";
    sc.funct = shellBit;
    this.commandList[this.commandList.length]=sc;
    
    sc = new ShellCommand();
    sc.command ="run";
    sc.description = " <pid> - Execute the program in memory with the specified pid.";
    sc.funct = shellRun;
    this.commandList[this.commandList.length]=sc;
    
    sc = new ShellCommand();
    sc.command ="setq";
    sc.description = " <quantum> - Sets the length of the cycle in the round robin scheduling.";
    sc.funct = shellSetQ;
    this.commandList[this.commandList.length]=sc;
    
    sc = new ShellCommand();
    sc.command ="getq";
    sc.description = " - Returns the current scheduler quantum.";
    sc.funct = shellGetQ;
    this.commandList[this.commandList.length]=sc;
    
    sc = new ShellCommand();
    sc.command ="active";
    sc.description = " - Displays the pids that are on the active queue.";
    sc.funct = shellActive;
    this.commandList[this.commandList.length]=sc;
    
    sc = new ShellCommand();
    sc.command ="runall";
    sc.description = " - Runs all of the processes on the resident's list.";
    sc.funct = shellRunAll;
    this.commandList[this.commandList.length]=sc;
    
    sc = new ShellCommand();
    sc.command ="kill";
    sc.description = " <pid> - Kills a process with the supplied id if present.";
    sc.funct = shellKill;
    this.commandList[this.commandList.length]=sc;
    
    sc = new ShellCommand();
    sc.command ="create";
    sc.description = " <filename> - Creates a file on the fs with the supplied filename.";
    sc.funct = shellCreate;
    this.commandList[this.commandList.length]=sc;
    
    sc = new ShellCommand();
    sc.command ="read";
    sc.description = " <filename> - Reads the data to the specified file.";
    sc.funct = shellRead;
    this.commandList[this.commandList.length]=sc;

    sc = new ShellCommand();
    sc.command ="write";
    sc.description = " <filename> <data> - Writes the data to the specified file (overwrites).";
    sc.funct = shellWrite;
    this.commandList[this.commandList.length]=sc;
    
    sc = new ShellCommand();
    sc.command ="delete";
    sc.description = " <filename> - Deletes specified file.";
    sc.funct = shellDelete;
    this.commandList[this.commandList.length]=sc;
    
    sc = new ShellCommand();
    sc.command ="format";
    sc.description = " -Formats the file system.";
    sc.funct = shellFormat;
    this.commandList[this.commandList.length]=sc;

    sc = new ShellCommand();
    sc.command ="ls";
    sc.description = " - Displays file names on file system.";
    sc.funct = shellLS;
    this.commandList[this.commandList.length]=sc;
    
        sc = new ShellCommand();
    sc.command ="setsch";
    sc.description = " <[rr,fcfs,priority]> -Sets the scheduler of the kernel.";
    sc.funct = shellSetS;
    this.commandList[this.commandList.length]=sc;

    sc = new ShellCommand();
    sc.command ="getsch";
    sc.description = " - Displays the currently employed scheduling algorithm.";
    sc.funct = shellGetS;
    this.commandList[this.commandList.length]=sc;
    
    // Display the initial prompt.
    this.putPrompt();
}

function shellPutPrompt()
{
    _StdIn.putText(this.promptStr);
}

/**
 * Drops the line down prompt and input all. 
 */
function shellDropLine()
{
    // Drop the line then output whatever was typed but not executed (inspired by how AIX handles this).
    _StdIn.advanceLine();
    this.putPrompt();
    
    if(_StdIn.buffer.getSize() > 0)
        _StdIn.putText(_StdIn.buffer);
}

function shellHandleInput(buffer)
{
    krnTrace("Shell Command~" + buffer);
    // 
    // Parse the input...
    //
    var userCommand = new UserCommand();
    userCommand = shellParseInput(buffer);
    // ... and assign the command and args to local variables.
    var cmd = userCommand.command;
    var args = userCommand.args;
    //
    // Determine the command and execute it.
    //
    // Javascript may not support associative arrays (one of the few nice features of PHP, actually)
    // so we have to iterate over the command list in attempt to find a match.  TODO: Is there a better way?
    var index = 0;
    var found = false;
    while (!found && index < this.commandList.length)
    {
        if (this.commandList[index].command === cmd.toLowerCase())
        {
            found = true;
            var fn = this.commandList[index].funct;
        }
        else
        {
            ++index;
        }
    }
    if (found)
    {
        this.execute(fn, args);
    }
    else
    {
        // It's not found, so check for curses and apologies before declaring the command invalid.
        if (this.curses.indexOf("[" + rot13(cmd) + "]") >= 0)      // Check for curses.
        {
            this.execute(shellCurse);
        }
        else if (this.apologies.indexOf("[" + cmd + "]") >= 0)      // Check for apoligies.
        {
            this.execute(shellApology);
        }
        else    // It's just a bad command.
        {
            this.execute(shellInvalidCommand);
        }
    }
}


function shellParseInput(buffer)
{
    var retVal = new UserCommand();
    //
    // 1. Remove leading and trailing spaces.
    buffer = trim(buffer);
    // 2. Lower-case it.
    buffer = buffer;
    // 3. Separate on spaces so we can determine the command and command-line args, if any.
    var tempList = buffer.split(" ");
    // 4. Take the first (zeroth) element and use that as the command.
    var cmd = tempList.shift();  // Yes, you can do that to an array in Javascript.  See the Queue class.
    // 4.1 Remove any left-over spaces.
    cmd = trim(cmd);
    // 4.2 Record it in the return value.
    retVal.command = cmd;
    //
    // 5. Now create the args array from what's left.
    for (var i in tempList)
    {
        var arg = trim(tempList[i]);
        if (arg != "")
        {
            retVal.args[retVal.args.length] = tempList[i];
        }
    }
    return retVal;
}


function shellExecute(fn, args)
{
    // we just got a command, so advance the line... 
    _StdIn.advanceLine();
    // .. call the command function passing in the args...
    fn(args);
    // Check to see if we need to advance the line again
    if (_StdIn.CurrentXPosition > CANVAS_OFFSET)
    {
        _StdIn.advanceLine();
    }
    // ... and finally write the prompt again.
    this.putPrompt();
}


//
// The rest of these functions ARE NOT part of the Shell "class" (prototype, more accurately), 
// as they are not denoted in the constructor.  The idea is that you cannot execute them from
// elsewhere as shell.xxx .  In a better world, and a more perfect Javascript, we'd be 
// able to make then private.  (Actually, we can. Someone look at Crockford's stuff and give me the details, please.)
//

//
// An "interior" or "private" class (prototype) used only inside Shell() (we hope).
//
function ShellCommand()     
{
    // Properties
    this.command = "";
    this.description = "";
    this.funct = "";
}

//
// Another "interior" or "private" class (prototype) used only inside Shell().
//
function UserCommand()
{
    // Properties
    this.command = "";
    this.args = [];
}


//
// Shell Command Functions.  Again, not part of Shell() class per se', just 
// called from there.
//
function shellInvalidCommand()
{
    _StdIn.putText("Invalid Command. ");
    if (_MCPMode)
    {
        _StdIn.putText("Want me to slow down your power cycles for you?");
    }
    else
    {
        _StdIn.putText("Type 'help' for user designed help.");
    }
}

function shellCurse()
{
    _StdIn.putText("You're getting brutal, "+ _UserName 
        + ". Brutal and needlessly sadistic.");
    _MCPMode = true;
}

function shellApology()
{
    _StdIn.putText(_UserName + ", I am so very disappointed in you.");
    _MCPMode = false;
}

function shellVer(args)
{
    _StdIn.putText(APP_NAME + " version " + APP_VERSION);    
    _StdIn.advanceLine();
    _StdIn.putText(APP_DESCRIPTION);
}

function shellHelp(args)
{
    _StdIn.putText("Commands:");
    for (i in _OsShell.commandList)
    {
        _StdIn.advanceLine();
        _StdIn.putText("  " + _OsShell.commandList[i].command + " " 
            + _OsShell.commandList[i].description);
    }    
}

function shellShutdown(args)
{
     _StdIn.putText("You've enjoyed all the power you've been given, haven't you?" +
        "I wonder how you'd take to working in a pocket calculator. ");
     // Call Kernal shutdown routine.
    krnShutdown();   
    // TODO: Stop the final prompt from being displayed.  If possible.  
}

function shellCls(args)
{
    _StdIn.clearScreen();
    _StdIn.resetXY();
}

function shellMan(args)
{
    if (args.length > 0)
    {
        var topic = args[0];
        switch (topic)
        {
            case "help": 
                _StdIn.putText("Help displays a list of MCP approved commands.");
                break;
            default:
                _StdIn.putText("No manual entry for " + args[0] + ".");
        }        
    }
    else
    {
        _StdIn.putText("Usage: man <topic>  Please supply a topic.");
    }
}

function shellTrace(args)
{
    if (args.length > 0)
    {
        var setting = args[0];
        switch (setting)
        {
            case "on": 
                if (_Trace && _MCPMode)
                {
                    _StdIn.putText("That isn't going to do you any good, " 
                        + _UserName + ", trace is on.");
                }
                else
                {
                    _Trace = true;
                    _StdIn.putText("Trace ON");
                }
                
                break;
            case "off": 
                _Trace = false;
                _StdIn.putText("Trace OFF");                
                break;                
            default:
                _StdIn.putText("Invalid arguement.  Usage: trace <on | off>.");
        }        
    }
    else
    {
        _StdIn.putText("Usage: trace <on | off>");
    }
}

function shellRot13(args)
{
    if (args.length > 0)
    {
        _StdIn.putText(args[0] + " = '" + rot13(args[0]) +"'");     // Requires Utils.js for rot13() function.
    }
    else
    {
        _StdIn.putText("Usage: rot13 <string>  Please supply a string.");
    }
}

function shellPrompt(args)
{
    if (args.length > 0)
    {
        _OsShell.promptStr = args[0];
    }
    else
    {
        _StdIn.putText("Usage: prompt <string>  Please supply a string.");
    }
}

/**
 * As a user your identity is quite well know by the likes of the programs.
 */
function shellWhoAmI(args)
{
    _StdIn.putText(_UserName);   
}

/**
 * A simple Whereami (since flynn is in hiding off the grid you are off of it).
 */
function shellWhereAmI(args)
{
    _StdIn.putText(_UserLocation);   
}

/**
 * Pulls the date and time from javascript's date class and outputs it to the 
 * console.
 */
function shellDate(args)
{
    var now = new Date();        
    _StdIn.putText(now.toLocaleString().split("(")[0]);
}

/**
 * Sets the global status that will be reflected in the task bar on the next os cycle.
 * Doesn't reflect case.
 */
function shellStatus (args)
{
    if (args.length > 0)
    {
        var tempStatus = args[0];

        for (var index=1; index < args.length; index++)
        {
            tempStatus += " " + args[index];   
        }
        
        if(tempStatus.length > 42 )
        {
            _StdIn.putText("Please no status greater in length than the answer " +
                "to the question of life the universe and everything (42).");
        }
        else
        {
            _KernelStatus = tempStatus   
        }
    }
    else
    {
        _StdIn.putText("Usage: status <string>  Please supply a string.");
    }
}

/**
 * Loads the hex from the input text area through the  simLoadProgram function 
 * in the host control script. Also performs a check of the code to ensure it 
 * complies to the standard repeating pattern of two hex digits and a space. 
 */
function shellLoad (args)
{
    if(args.length == 0)
    {
        krnLoadProgram();
    }
    else
    {
        if(parseInt(args[0],10) % 1 === 0)
        {
            krnLoadProgram(parseInt(args[0],10));
        }
        // This is more of an easter egg than anything appreciable.
        else if (args[0] == "tron")
        {
           _StdIn.putText("I fight for the user!"); 
        }
        else if (args[0] == "sark")
        {
            _StdIn.putText("There's nothing special about you. You're just an ordinary program..");     
        }
         else if (args[0] == "cycles")
        {
            CycleGame.init(0,1,2,"#display");  
            //I need to kill the OS since it lags the gameplay
            simBtnHaltOS_click();
        }
        else
        {
            _StdIn.putText("Program was not rezzed.");   
        }
    }
}

/**
 * Executes a trap and brings up the Orange screen of death, summoning the 
 * Master Control Program to Derez any offending program or user...
 */
function shellOSOD(args)
{
    _KernelInterruptQueue.enqueue( new Interrupt(TRAP_IRQ, 
            new Array("I'm going to have to put you on the game grid."))); 
}

/**
 * Asks the program bit a question.
 * If no question mark is detected at the end of the statement No is always returned.
 * Otherwise bit's response is derived by the mod 2 of the length of the first arg.
 * Note: bit is this guy: http://images.wikia.com/tron/images/b/bc/Bitidle.png
 */
function shellBit(args)
{    
    var response = "No";
    
    if( args.length > 0)
    {    
        var question = args[args.length -1].search(/\?/) != -1 ? 1 : 0;
    
        response = args[0].length % 2 * question > 0 ? "Yes" : "No";
    }
        
    _StdIn.putText("Bit: " + response );   
}

/**
 * Runs a process with the supplied pid.
 */
function shellRun(args)
{
    if(args.length > 0)
    {
        krnRunProgram(args[0]);
    }
    else
    {
        _StdIn.putText("Please supply a program id.");
    }
}

/**
 *  Sets the quantum of the kernel scheduler. 
 */
function shellSetQ (args)
{
    if(args.length > 0)
    {
        krnSetQuantum(args[0]);
    }
    else
    {
        _StdIn.putText("Please supply a quanta.");
    }
}

/**
 *  Gets the quantum of the kernel scheduler. 
 */
function shellGetQ ()
{
    krnGetQuantum();
}

/**
 * Displays the active processes.
 */
function shellActive ()
{
    _StdIn.putText(krnActivePIDS());   
}

/**
 * Runs all processes on the Resident's List.
 */
function shellRunAll ()
{
    krnRunResidents();
}

/**
 * Kills the specified process.
 */
function shellKill(args)
{
    if(args.length > 0)
    {
        krnKillProcess(args[0]);
    }
    else
    {
        _StdIn.putText("Please supply a program id.");
    }
}

/**
 * Invokes the file system create command.
 * 
 * @param args -0 The name of the file to create.
 */
function shellCreate(args)
{    
    if(args[0].indexOf("@") === 0)
        _StdIn.putText("@ is a reserved leading character!");
    else
        krnDiskCreate(args[0]);
}

/**
 * Invokes the file system read command.
 * 
 * @params args -0 The name of the file to read.
 */
function shellRead(args)
{
    krnDiskRead(args[0]);
}

/**
 * Invokes the file system write command.
 * 
 * @param args -0 The name of the file to write to.
 *             -[1..] The data to write to the file. 
 */
function shellWrite(args)
{
    var filename = args.shift();
    var data     = args.join(" ");
    
    if(filename.indexOf("@") === 0)
        _StdIn.putText("Editing of swap files is illegal!");
    else
        krnDiskWrite(filename, data);
}

/**
 * Invokes the file system delete command.
 * 
 * @param args -0 The name of the file to delete.
 */
function shellDelete(args)
{
    if(args[0].indexOf("@") === 0)
        _StdIn.putText("Deletion of swap files is illegal!");
    else
        krnDiskDelete(args[0]);
}

/**
 * Formats the file system, doesn't work if a process is executing 
 * (prevents clobbering of the swap files).
 */
function shellFormat()
{
    if(krnCheckExecution())
        _StdIn.putText("Please wait for the currently executing process to finish before formatting");
    else
        krnDiskFormat();
}

/**
 * Lists the files currently on the file system.
 */
function shellLS()
{
    krnDiskLS();
}

/**
 * Sets the scheduler for the kernel.
 * @param args -0: The scheduler that the kernel should be set to.
 */
function shellSetS(args)
{
    krnSetScheduler(args[0].toLowerCase());
}

/**
 * Retrieves the scheduler from the kernel.
 */
function shellGetS()
{
    krnGetScheduler();
}

