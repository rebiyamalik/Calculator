document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const display = document.getElementById('display');
    const historyDisplay = document.getElementById('historyDisplay');
    const digitButtons = document.querySelectorAll('.digit');
    const operatorButtons = document.querySelectorAll('.operator');
    const equalsButton = document.getElementById('equals');
    const clearButton = document.getElementById('clear');
    const decimalButton = document.getElementById('decimal');
    const negateButton = document.getElementById('negate');
    const percentButton = document.getElementById('percent');
    const recentCalculationsList = document.getElementById('recentCalculationsList');
  
    // Calculator State
    let displayValue = '0';
    let firstOperand = null;
    let waitingForSecondOperand = false;
    let operator = null;
    let calculationHistory = '';
    
    // API Functions
    async function saveCalculation(expression, result) {
      try {
        const response = await fetch('/api/calculations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            expression: expression,
            result: result
          })
        });
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error saving calculation:', error);
      }
    }
    
    async function getRecentCalculations(limit = 5) {
      try {
        const response = await fetch(`/api/calculations/recent?limit=${limit}`);
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error fetching recent calculations:', error);
        return [];
      }
    }
  
    // Update the display
    function updateDisplay() {
      display.textContent = displayValue;
      historyDisplay.textContent = calculationHistory;
    }
  
    // Get operator symbol for history display
    function getOperatorSymbol(op) {
      switch (op) {
        case 'add': return '+';
        case 'subtract': return '-';
        case 'multiply': return '×';
        case 'divide': return '÷';
        case 'percent': return '%';
        default: return '';
      }
    }
  
    // Handle digit input
    function handleDigitClick(digit) {
      if (waitingForSecondOperand) {
        displayValue = digit;
        waitingForSecondOperand = false;
      } else {
        displayValue = displayValue === '0' ? digit : displayValue + digit;
      }
      updateDisplay();
    }
  
    // Handle decimal point
    function handleDecimalClick() {
      if (waitingForSecondOperand) {
        displayValue = '0.';
        waitingForSecondOperand = false;
      } else if (!displayValue.includes('.')) {
        displayValue += '.';
      }
      updateDisplay();
    }
  
    // Calculate function
    function calculate(firstOperand, secondOperand, operator) {
      switch (operator) {
        case 'add':
          return firstOperand + secondOperand;
        case 'subtract':
          return firstOperand - secondOperand;
        case 'multiply':
          return firstOperand * secondOperand;
        case 'divide':
          return secondOperand !== 0 ? firstOperand / secondOperand : 'Error';
        case 'percent':
          return (firstOperand / 100) * secondOperand;
        default:
          return secondOperand;
      }
    }
  
    // Handle operators
    function handleOperatorClick(nextOperator) {
      const inputValue = parseFloat(displayValue);
  
      if (operator && waitingForSecondOperand) {
        operator = nextOperator;
        calculationHistory = `${firstOperand} ${getOperatorSymbol(nextOperator)}`;
        updateDisplay();
        return;
      }
  
      if (firstOperand === null && !isNaN(inputValue)) {
        firstOperand = inputValue;
      } else if (operator) {
        const result = calculate(firstOperand, inputValue, operator);
        
        // Check if result is a string (error)
        if (typeof result === 'string') {
          displayValue = result;
          firstOperand = null;
          waitingForSecondOperand = true;
          operator = null;
          calculationHistory = '';
          updateDisplay();
          return;
        }
  
        const formattedResult = parseFloat(result.toFixed(7));
        displayValue = formattedResult.toString();
        firstOperand = formattedResult;
        calculationHistory = `${formattedResult} ${getOperatorSymbol(nextOperator)}`;
      } else {
        calculationHistory = `${inputValue} ${getOperatorSymbol(nextOperator)}`;
      }
  
      waitingForSecondOperand = true;
      operator = nextOperator;
      updateDisplay();
    }
  
    // Handle equals button
    function handleEqualsClick() {
      if (firstOperand !== null && operator && !waitingForSecondOperand) {
        const secondOperand = parseFloat(displayValue);
        const expression = `${firstOperand} ${getOperatorSymbol(operator)} ${secondOperand}`;
        calculationHistory = `${expression} =`;
        
        const result = calculate(firstOperand, secondOperand, operator);
        
        // Check if result is a string (error)
        if (typeof result === 'string') {
          displayValue = result;
          firstOperand = null;
          waitingForSecondOperand = true;
          operator = null;
          updateDisplay();
          return;
        }
  
        const formattedResult = parseFloat(result.toFixed(7));
        displayValue = formattedResult.toString();
        
        // Save calculation to database and refresh the list
        saveCalculation(expression, formattedResult.toString())
          .then(() => displayRecentCalculations())
          .catch(error => console.error('Error saving calculation:', error));
        
        firstOperand = formattedResult;
        operator = null;
        waitingForSecondOperand = true;
        updateDisplay();
      }
    }
  
    // Handle clear button
    function handleClearClick() {
      displayValue = '0';
      firstOperand = null;
      waitingForSecondOperand = false;
      operator = null;
      calculationHistory = '';
      updateDisplay();
    }
  
    // Handle negate button (+/-)
    function handleNegateClick() {
      const value = parseFloat(displayValue);
      displayValue = (value * -1).toString();
      updateDisplay();
    }
  
    // Handle percentage button
    function handlePercentageClick() {
      const value = parseFloat(displayValue);
      displayValue = (value / 100).toString();
      updateDisplay();
    }
  
    // Add event listeners to digit buttons
    digitButtons.forEach(button => {
      button.addEventListener('click', () => {
        handleDigitClick(button.textContent);
      });
    });
  
    // Add event listeners to operator buttons
    operatorButtons.forEach(button => {
      button.addEventListener('click', () => {
        const operatorId = button.id;
        handleOperatorClick(operatorId);
      });
    });
  
    // Event listeners for other buttons
    equalsButton.addEventListener('click', handleEqualsClick);
    clearButton.addEventListener('click', handleClearClick);
    decimalButton.addEventListener('click', handleDecimalClick);
    negateButton.addEventListener('click', handleNegateClick);
    percentButton.addEventListener('click', handlePercentageClick);
  
    // Keyboard support
    document.addEventListener('keydown', function(event) {
      const { key } = event;
  
      // Numbers 0-9
      if (/^[0-9]$/.test(key)) {
        event.preventDefault();
        handleDigitClick(key);
        return;
      }
  
      // Operators
      switch (key) {
        case '+':
          event.preventDefault();
          handleOperatorClick('add');
          break;
        case '-':
          event.preventDefault();
          handleOperatorClick('subtract');
          break;
        case '*':
        case 'x':
          event.preventDefault();
          handleOperatorClick('multiply');
          break;
        case '/':
          event.preventDefault();
          handleOperatorClick('divide');
          break;
        case '%':
          event.preventDefault();
          handlePercentageClick();
          break;
        case '.':
        case ',':
          event.preventDefault();
          handleDecimalClick();
          break;
        case 'Enter':
        case '=':
          event.preventDefault();
          handleEqualsClick();
          break;
        case 'Escape':
        case 'c':
        case 'C':
          event.preventDefault();
          handleClearClick();
          break;
        case 'Backspace':
          // Backspace functionality
          event.preventDefault();
          if (displayValue.length > 1 && !waitingForSecondOperand) {
            displayValue = displayValue.slice(0, -1);
          } else {
            displayValue = '0';
          }
          updateDisplay();
          break;
      }
    });
  
    // Function to display recent calculations
    async function displayRecentCalculations() {
      try {
        const calculations = await getRecentCalculations();
        
        // Clear the list
        recentCalculationsList.innerHTML = '';
        
        if (calculations.length === 0) {
          const emptyItem = document.createElement('li');
          emptyItem.textContent = 'No calculations yet';
          recentCalculationsList.appendChild(emptyItem);
          return;
        }
        
        // Add each calculation to the list
        calculations.forEach(calc => {
          const li = document.createElement('li');
          
          const expressionDiv = document.createElement('div');
          expressionDiv.className = 'calculation-expression';
          expressionDiv.textContent = `${calc.expression} =`;
          
          const resultDiv = document.createElement('div');
          resultDiv.className = 'calculation-result';
          resultDiv.textContent = calc.result;
          
          li.appendChild(expressionDiv);
          li.appendChild(resultDiv);
          
          // Add a click handler to use this calculation
          li.addEventListener('click', () => {
            displayValue = calc.result;
            firstOperand = parseFloat(calc.result);
            waitingForSecondOperand = true;
            operator = null;
            calculationHistory = '';
            updateDisplay();
          });
          
          recentCalculationsList.appendChild(li);
        });
      } catch (error) {
        console.error('Error displaying recent calculations:', error);
      }
    }
    
    // Initialize display and load recent calculations
    updateDisplay();
    displayRecentCalculations();
  });