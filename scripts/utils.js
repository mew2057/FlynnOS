/* --------  
   Utils.js

   Utility functions.
   -------- */

function trim(str)      // Use a regular expression to remove leading and trailing spaces.
{
	return str.replace(/^\s+ | \s+$/g, "");
	/* 
	Huh?  Take a breath.  Here we go:
	- The "|" separates this into two expressions, as in A or B.
	- "^\s+" matches a sequence of one or more whitespace characters at the beginning of a string.
    - "\s+$" is the same thing, but at the end of the string.
    - "g" makes is global, so we get all the whitespace.
    - "" is nothing, which is what we replace the whitespace with.
	*/
	
}

/**
 * Checks a string to see if it matches the hex assembly specified in class.
 * @param str The string to be parsed.
 */
function checkForHex(str)
{
    var retVal = false; 

    // If there are too many contiguous whitespaces just ignore it outright.
    // XXX Should this be this way?
    if (!str.match(/[ ]{2,}/))
    {
        // Get the tokens and set up a fail flag
        var tokens=str.split(" ");
        var failFlag = false;
        
        // Iterate over the tokens and check for any non hex characters 
        // or tokens exceeding 2 characters.
        for (var index in tokens)
        {
            if(!tokens[index].match(/[0123456789abcdef]{2}/))
            {
                failFlag = true;
            }
        }
        
        retVal = !failFlag;   
    } 
    
    return retVal;
}

function rot13(str)     // An easy-to understand implementation of the famous and common Rot13 obfuscator.
{                       // You can do this in three lines with a complex regular experssion, but I'd have
    var retVal = "";    // trouble explaining it in the future.  There's a lot to be said for obvious code.
    for (var i in str)
    {
        var ch = str[i];
        var code = 0;
        if ("abcedfghijklmABCDEFGHIJKLM".indexOf(ch) >= 0)
        {            
            code = str.charCodeAt(i) + 13;  // It's okay to use 13.  It's not a magic number, it's called rot13.
            retVal = retVal + String.fromCharCode(code);
        }
        else if ("nopqrstuvwxyzNOPQRSTUVWXYZ".indexOf(ch) >= 0)
        {
            code = str.charCodeAt(i) - 13;  // It's okay to use 13.  See above.
            retVal = retVal + String.fromCharCode(code);
        }
        else
        {
            retVal = retVal + ch;
        }
    }
    return retVal;
}
