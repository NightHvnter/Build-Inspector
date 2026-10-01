import type { Cpu, Motherboard, CompatIssue } from '@shared/types' //importalo sempre 

//funzione per controllare se la CPU può essere usata in una determinata scheda madre
//creazione di più rules dove vengono comparate se determinate componenti possono matchare
//dopo creo altre classi per la comparazione con i requisiti dei giochi

export function checkSocket
(
    cpu: Cpu | null,
    mb: Motherboard | null
): 
    CompatIssue | null {
    if (!cpu || !mb) return null    //verifico se è presente una cpu
    if (cpu.Socket === mb.Socket) return null   //verifico se la cpu matcha

    //errore se non matchano
    return {
    ruleId: 'socket',
    severity: 'error',
    message: `${cpu.model} usa ${cpu.socket}, ma ${mb.model} usa ${mb.socket}.`,
    }
}