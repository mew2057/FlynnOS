/* ------------  
   Globals.js

   Global CONSTANTS and _Variables.
   (Global over both the OS and Hardware Simulation.)
   
   This code references page numbers in the text book: 
   Operating System Concepts 8th editiion by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
   ------------ */

//
// Global Constants
//
var APP_NAME = "FlynnOS";  // 'cause I was at a loss for a better name.
var APP_VERSION = "0.3";
var APP_DESCRIPTION = "Welcome to The Grid: A digital frontier.";
var CPU_CLOCK_INTERVAL = 100;   // in ms, or milliseconds, so 1000 = 1 second.
// Interrupt ReQuests.
var TIMER_IRQ    = 0;  // Pages 23 (timer), 9 (interrupts), and 561 (interrupt priority). 
                       // NOTE: The timer is different from hardware clock pulses. Don't confuse these.
var KEYBOARD_IRQ = 1;
var SYSTEM_IRQ = 2;
var FAULT_IRQ = 3;
var BRK_IRQ = 4;
var TRAP_IRQ = 5;
var CONTEXT_IRQ = 6;
var DISK_REQUEST_IRQ = 7;
var DISK_RESPONSE_IRQ = 8;
// Fault Types.
var INST_FAULT = 1; //An instruction fault.
var MEM_FAULT  = 2; //A memory fault.
var CPU_FAULT  = 3;
// Digit Punctuation.
var DIGIT_PUNCTUATIONS= [')','!','@','#','$','%','^','&','*','('];
// The instruction count for the CPU.
var INSTRUCTION_COUNT = 256;
// The limit to the number of characters in the log div.
var LOG_CHAR_LIMIT = 500000;
// Defines the logger sources.
var LOGGER_SOURCE = {
    "SRC":["CPU","INST","MEM","SCH","HOST","OS","DISP-ALL"],
    "CPU" :"CPU",
    "INST":"INST",
    "MEM" :"MEM",
    "SCH" :"SCH",
    "HOST":"HOST",
    "OS"  :"OS",
    "DISP-ALL" :"DISP-ALL"
};
var _LOGGER_VIEW = {
    "CPU" : true,
    "INST": true,
    "MEM" : true,
    "SCH" : true,
    "HOST": true,
    "OS"  : true,
    "DISP-ALL" : true
};

var FS_OPS = {
    "CREATE":0,
    "READ":1,
    "WRITE":2,
    "DELETE":3,
    "FORMAT":4
};
    

//
// Global Variables
//
//Hardware
var _CPU = null;
var _InstructionSet = null; 
var _CoreMemory = null;
var _OSclock = 0;       // Page 23.

//Kernel
var _StepEnabled = false;
var _Step = false;
var _MemoryManager = null;
var _KernelStatus = "default"; // The kernel status field specified by iProject1
var _Scheduler = null; //

// Default the OS trace to be on.
var _Trace = true;

// OS queues
var _KernelInterruptQueue = null;
var _KernelBuffers = null;
var _KernelInputQueue = null;
var _ReadyQueue = null;
var _Residents = null;
var _Terminated = null;



var _Mode = 0;   // 0 = Kernel Mode, 1 = User Mode.  See page 21.

// Buffer limits.
var SHELL_COMMAND_BUFFER_LIMIT = 20;

// Standard input and output
var _StdIn  = null;
var _StdOut = null;

// UI
var _Console = null;
var _OsShell = null;

// At least this OS is not trying to kill you. (Yet.)
var _MCPMode = false;

//
// Global Device Driver Objects - page 12
//
var krnKeyboardDriver = null;

// User Data
var _UserName = "flynn";
var _UserLocation = "Off the Grid.";

var _SwitchPageView = true;

function globalReset()
{
    _CoreMemory = null;
    _OSclock = 0;       // Page 23.
    _CPU = null;
    _InstructionSet = null; 

    _StepEnabled = false;
    _Step = false;
    _MemoryManager = null;  
    _Mode = 0;   // 0 = Kernel Mode, 1 = User Mode.  See page 21.
    _KernelStatus = "default"; // The kernel status field specified by iProject1
    _Scheduler = null; //W    
    _Trace = true;
    _MCPMode = false;
    
    // User Data
    _UserName = "flynn";
    _UserLocation = "Off the Grid.";
    
    _KernelInterruptQueue = null;
    _KernelBuffers = null;
    _KernelInputQueue = null;
    _ReadyQueue = null;
    _Residents = null;
    _Terminated = null;
    
    // Standard input and output
     _StdIn  = null;
    _StdOut = null;

    // UI
    _Console = null;
    _OsShell = null;
    
    _SwitchPageView = true;
    
    //
    // Global Device Driver Objects - page 12
    //
    krnKeyboardDriver = null;
    
    _LOGGER_VIEW = {
        "CPU" : true,
        "INST": true,
        "MEM" : true,
        "SCH" : true,
        "HOST": true,
        "OS"  : true,
        "DISP-ALL" : true
    };
}

// Canvas animations stuff
var CANVAS = null;                  // Initialized in hostInit().
var DRAWING_CONTEXT = null;         // Initialized in hostInit().
var TASKBAR_CANVAS = null;          // Initialized in canvasAnimations.
var TASKBAR_CONTEXT = null;         // Initialized in canvasAnimations.

var DEFAULT_FONT = "monospace";     // Not used  
var DEFAULT_FONT_SIZE = 13;         // Font Size, not terribly useful at present.
var FONT_HEIGHT_MARGIN = 8;         // Additional space added to font size when advancing a line.

var TASKBAR_FONT = "normal 20px monospace"; 

// The various colors used in the canvasi (canvases).
var CANVAS_BACKGROUNDS = "#02181d";
var CANVAS_OUTLINES = "#b5ffff";
var CANVAS_TRAP_BACKGROUNDS =  "#ff7920" ;
var CANVAS_TRAP_OUTLINES = "#fcde0e";

// Some spacing constants.
var CANVAS_RADIUS =  15;
var CANVAS_OFFSET = CANVAS_RADIUS;  
var CANVAS_BASE_Y_OFFSET = 10;
