class SCM {
    constructor(script) {
        this.script = script.split('\n').map(line => line.trim()).filter(line => this.isValidLine(line));
        this.labels = {};
        this.vars = {};
        this.stack = [];
        this.pointer = 0;
        this.running = true;
        this.parseLabels();
    }

    // Filtrar líneas válidas (sin comentarios o vacías)
    isValidLine(line) {
        return line && !line.startsWith('//');
    }

    // Parseo de etiquetas
    parseLabels() {
        this.script.forEach((line, index) => {
            if (line.startsWith(':')) {
                const labelName = line.substring(1);
                this.labels[labelName] = index;
            }
        });
    }

    // Obtener el valor, ya sea un número o una variable
    getValue(value) {
        if (value.endsWith('@')) {
            return this.vars[value] ?? 0;  // Si es una variable, devolver su valor
        }
        return isNaN(value) ? value : parseInt(value);  // Si es un número, devolver el valor numérico
    }

    execute() {
        while (this.pointer < this.script.length && this.running) {
            const line = this.script[this.pointer];
            this.processLine(line);
            this.pointer++;
        }
    }

    processLine(line) {
        if (line.startsWith('PRINT')) {
            const parts = line.split(' ');
            const message = this.getValue(parts[1]);
            console.log(message);
        } else if (line.startsWith('SET')) {
            const [_, varName, value] = line.split(' ');
            this.vars[varName] = this.getValue(value);
        } else if (line.startsWith('GET')) {
            const [_, targetVar, sourceVar] = line.split(' ');
            this.vars[targetVar] = this.getValue(sourceVar);
        } else if (line.startsWith('IS')) {
            const [_, varName, value] = line.split(' ');
            if (this.vars[varName] != this.getValue(value)) {
                this.pointer++;  // Saltar la siguiente línea si la condición falla
            }
        } else if (line.startsWith('ADD')) {
            const [_, varName, value] = line.split(' ');
            this.vars[varName] = this.vars[varName] + this.getValue(value);
        } else if (line.startsWith('SUB')) {
            const [_, varName, value] = line.split(' ');
            this.vars[varName] = this.vars[varName] - this.getValue(value);
        } else if (line.startsWith('WAIT')) {
            const time = this.getValue(line.split(' ')[1]);
            this.running = false;
            setTimeout(() => {
                this.running = true;
                this.execute(); // Reanudar después de la espera
            }, time);
        } else if (line.startsWith('GOTO')) {
            const label = line.split(' ')[1].substring(1);
            this.pointer = this.labels[label] - 1;  // Ajustar el puntero
        } else if (line.startsWith('GOSUB')) {
            const label = line.split(' ')[1].substring(1);
            this.stack.push(this.pointer);  // Guardar posición actual
            this.pointer = this.labels[label] - 1;
        } else if (line.startsWith('RETURN')) {
            this.pointer = this.stack.pop();  // Retornar a la última posición guardada
        } else if (line.startsWith('END_SCRIPT')) {
            this.running = false;
        } else if (line.startsWith(':')) {
            // Es solo una etiqueta, no hacer nada
        }
    }
}


let script = `
PRINT 3@ // Muestra el valor de la variable 0@
SET 0@ 33 // Asigna 33 a la variable 0@
IS 0@ 33 // Compara si la variable 0@ es 33
GET 1@ 0@ // Copia el valor de 0@ a 1@
WAIT 1000 // Espera 1 segundo
GOTO @LABEL // Salta a la etiqueta LABEL
WAIT 2000 // Espera 2 segundos
:LABEL

GOSUB @FUNC // Salta a la subrutina FUNC
PRINT 1@
END_SCRIPT // Finaliza todo el script.

:FUNC
RETURN // Retorna a la etiqueta de donde se invocó la subrutina
`;

let scm = new SCM(script);
scm.execute();