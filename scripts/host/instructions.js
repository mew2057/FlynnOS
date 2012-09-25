// The instruction count for the OS.
var INSTRUCTION_COUNT = 256;

function Instruction(funct, args)
{
    this.funct = funct;
    this.argCount = args;
}

/**
 * The constructor for a 6502 instruction set. I opted for this design as it 
 * allows for easy expansion and I am able to replace the instruction set easily
 * if desired.
 */
function InstructionSet6502()
{
    this.set = new Array(INSTRUCTION_COUNT);
    
    this.set[169] = new Instruction(hostLoadAcc,1);
    this.set[173] = new Instruction(hostLoadAcc,2);
    this.set[141] = new Instruction(hostStoreAcc,2);
    this.set[109] = new Instruction(hostAddWithCarry,2);
    this.set[162] = new Instruction(hostLoadX,1);
    this.set[174] = new Instruction(hostLoadX,2);
    this.set[160] = new Instruction(hostLoadY,1);
    this.set[172] = new Instruction(hostLoadY,2);
    this.set[234] = new Instruction(hostNOP,0);
    this.set[0]   = new Instruction(hostBreakProcess,0);
    this.set[236] = new Instruction(hostCompareX,2);
    this.set[208] = new Instruction(hostBranchNotEqual,1);
    this.set[238] = new Instruction(hostIncrementByte,2);
    this.set[255] = new Instruction(hostSystemCall,0);
    
}

InstructionSet6502.prototype.get = function(opcode)
{
    var index = parseInt(opcode, 16);

var retVal = null;
    
    if (index < this.set.length)
    {
        retVal = this.set[index];
    }
    return retVal;
};
