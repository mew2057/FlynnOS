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
    
    this.set[169] = new Instruction(krnLoadAcc,1);
    this.set[173] = new Instruction(krnLoadAcc,2);
    this.set[141] = new Instruction(krnStoreAcc,2);
    this.set[109] = new Instruction(krnAddWithCarry,2);
    this.set[162] = new Instruction(krnLoadX,1);
    this.set[174] = new Instruction(krnLoadX,2);
    this.set[160] = new Instruction(krnLoadY,1);
    this.set[172] = new Instruction(krnLoadY,2);
    this.set[234] = new Instruction(krnNOP,0);
    this.set[0]   = new Instruction(krnBreakProcess,0);
    this.set[236] = new Instruction(krnCompareX,2);
    this.set[208] = new Instruction(krnBranchNotEqual,1);
    this.set[238] = new Instruction(krnIncrementByte,2);
    this.set[255] = new Instruction(krnSystemCall,0);
    
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
