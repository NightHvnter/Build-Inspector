import type { Motherboard, CompatIssue, Ram } from '@shared/types' //importalo sempre

//funzione per controllare se la RAM può essere usata in una determinata scheda madre
//creazione di più rules dove vengono comparate se determinate componenti possono matchare
//dopo creo altre classi per la comparazione con i requisiti dei giochi

export function checkRamType 
(
    ram : Ram |null,
    mb : Motherboard | null
):

    CompatIssue | null  
    
    {
        if (!ram || !mb ) return null    //verifico se è presente una cpu
        if (ram.type === mb.memoryType) return null //verifico se la cpu matcha

    //errore se non matchano
        return {
        ruleId : 'ram-type',
        severity : 'error',
        message : `${ram.model} usa ${ram.type}, ma ${mb.model} usa ${mb.memoryType}.`,
        }
    }
