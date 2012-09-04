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
var APP_VERSION = "0.1"
var APP_DESCRIPTION = "Welcome to The Grid: A digital frontier."

var CPU_CLOCK_INTERVAL = 100;   // in ms, or milliseconds, so 1000 = 1 second.

var TIMER_IRQ    = 0;  // Pages 23 (timer), 9 (interrupts), and 561 (interrupt priority). 
                       // NOTE: The timer is different from hardware clock pulses. Don't confuse these.
var KEYBOARD_IRQ = 1;  
//
// Global Variables
//
var _CPU = null;

var _OSclock = 0;       // Page 23.

var _Mode = 0;   // 0 = Kernel Mode, 1 = User Mode.  See page 21.

var _KernelStatus = "Default"; // The kernel status field specified by iProject1

var _KernelLoadedProgram = ""; //XXX This will change in future versions.

// TODO: Fix the naming convention for these next five global vars.
var CANVAS = null;              // Initialized in hostInit().
var DRAWING_CONTEXT = null;     // Initialized in hostInit().
var TASKBAR_CANVAS = null;      // Initialized in canvasAnimations.
var TASKBAR_CONTEXT = null;     // Initialized in canvasAnimations.

var TASKBAR_FONT = "normal 20px monospace";
var CANVAS_BACKGROUNDS = "#02181d";
var CANVAS_OUTLINES = "#b5ffff";
var CANVAS_RADIUS =  15;
var CANVAS_OFFSET = CANVAS_RADIUS;
var CONSOLE_BASE_Y_OFFSET = 2;


var DEFAULT_FONT = "monospace";      // Ignored, just a place-holder in this version.
var DEFAULT_FONT_SIZE = 13;     
var FONT_HEIGHT_MARGIN = 4;     // Additional space added to font size when advancing a line.

// Default the OS trace to be on.
var _Trace = true;

// OS queues
var _KernelInterruptQueue = null;
var _KernelBuffers = null;
var _KernelInputQueue = null;

// Standard input and output
var _StdIn  = null;
var _StdOut = null;

// UI
var _Console = null;
var _OsShell = null;

// At least this OS is not trying to kill you. (Yet.)
var _SarcasticMode = false;

//
// Global Device Driver Objects - page 12
//
var krnKeyboardDriver = null;

// Date Constants
var DAYS = [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" ];
var MONTHS = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Digit Punctuation.
var DIGIT_PUNCTUATIONS= [')','!','@','#','$','%','^','&','*','(']

// User Data
var _UserName = "flynn";
var _UserLocation = "Off the Grid.";
