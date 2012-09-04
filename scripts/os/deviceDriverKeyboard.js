/* ----------------------------------
   DeviceDriverKeyboard.js
   
   Requires deviceDriver.js
   
   The Kernel Keyboard Device Driver.
   ---------------------------------- */

DeviceDriverKeyboard.prototype = new DeviceDriver;  // "Inherit" from prototype DeviceDriver in deviceDriver.js.
function DeviceDriverKeyboard()                     // Add or override specific attributes and method pointers.
{
    // "subclass"-specific attributes.
    // this.buffer = "";    // TODO: Do we need this?
    // Override the base method pointers.
    this.driverEntry = krnKbdDriverEntry;
    this.isr = krnKbdDispatchKeyPress;
    // "Constructor" code.
}

function krnKbdDriverEntry()
{
    // Initialization routine for this, the kernel-mode Keyboard Device Driver.
    this.status = "loaded";
    // More?
}

function krnKbdDispatchKeyPress(params)
{
    
    if( params.length < 2)
    {
        krnTrapError("Something horrible has happened in the Kernel's Interrupt"+
                        "Service Handler in passing paramerters to the keyboard driver." );     
    }
    // Parse the params.    
    var keyCode = params[0];
    var isShifted = params[1];

    krnTrace("Key code:" + keyCode + " shifted:" + isShifted);
    var chr = "";
    // Check to see if we even want to deal with the key that was pressed.
    if ( ((keyCode >= 65) && (keyCode <= 90)) )   // A..Z
    {
        // Determine the character we want to display.  
        // Assume it's lowercase...
        chr = String.fromCharCode(keyCode + 32);
        // ... then check the shift key and re-adjust if necessary.
        if (isShifted)
        {
            chr = String.fromCharCode(keyCode);
        }
        // TODO: Check for caps-lock and handle as shifted if so.
        _KernelInputQueue.enqueue(chr); 

    }    
    else if (  (keyCode == 32)                        ||    // space   
               (keyCode == 8)                         ||    // backspace
               (keyCode == 13) )                            // enter
    {
        
        chr = String.fromCharCode(keyCode);    
        _KernelInputQueue.enqueue(chr); 
    }
    else if ( (keyCode >= 48) && (keyCode <= 57) )          // digits: Separating this keeps down cyclomatic complexity (albeit by a minor factor)
    {
        chr = String.fromCharCode(keyCode);   
        
        if(isShifted)
        {
            chr = DIGIT_PUNCTUATIONS[chr];
        }
        
        _KernelInputQueue.enqueue(chr); 
    }
    else if ( (keyCode >= 96) && (keyCode <= 111 ) )        // Numpad keys.
    {
        var subFactor = keyCode <= 105?48:64;   // I found that the keycodes adhered to a set offset from the unicode value in their respective ranges.
        
        chr = String.fromCharCode(keyCode - subFactor); 
        _KernelInputQueue.enqueue(chr);         

    }
    else 
    {
        var unicode = null;        
  
        switch (keyCode)
        {
            case 186:
                unicode = isShifted?58:59;
                break;
            case 187:
                unicode = isShifted?43:61;
                break; 
            case 188:
                unicode = isShifted?60:44;
                break;
            case 189:
                unicode = isShifted?95:45;
                break;
            case 190:
                unicode = isShifted?62:46;
                break;
            case 191:
                unicode = isShifted?63:47;
                break;
            case 192:
                unicode = isShifted?126:96;
                break;
            case 219:
                unicode = isShifted?123:91;
                break;
            case 220:
                unicode = isShifted?124:92;
                break;
            case 221:
                unicode = isShifted?125:93;
                break;
            case 222:
                unicode = isShifted?34:39;
                break;
            default:
                break;
        }
        
        if ( unicode ) // If the unicode character was loaded, we're in business.
        {
            chr = String.fromCharCode(unicode);
        }
        
        if (chr == "" && keyCode != 16)
        {
            // If the key code isn't valid then trap.
            krnTrapError("Key Code:\"" + keyCode + "\" was not defined." );   
        }
        else if (keyCode!= 16)
        {
            _KernelInputQueue.enqueue(chr); 
        }         
    }
}