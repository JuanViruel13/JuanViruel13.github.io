async function createMealPlan(event) {

    event.preventDefault();
    console.log('Form submitted for creating a meal plan.');

    showLoadingSpinner();

    // API credentials and endpoint
    const appId = 'a6be8e8e';
    const apiKey = 'd6b3bf8c553e75cdc98fb7cab0677572';
    const accountUser = 'jcv13';
    const url = `https://api.edamam.com/api/meal-planner/v1/${appId}/select`;
    console.log(`API URL: ${url}`);

    // User sets the amount of days for the meal plan
    const days = parseInt(document.getElementById('days').value);
    console.log(`Days selected: ${days}`);

    // User sets the meals for the meal plan
    const selectedMeals = [];
    if (document.getElementById('breakfast').checked) {
        selectedMeals.push('Breakfast');
    }
    if (document.getElementById('lunch').checked) {
        selectedMeals.push('Lunch');
    }
    if (document.getElementById('dinner').checked) {
        selectedMeals.push('Dinner');
    }
    console.log(`Selected meals: ${selectedMeals.join(', ')}`);
    

    // Retrieve the selected dietary preferences
    const diets = Array.from(document.querySelectorAll('input[name="diet"]:checked')).map(checkbox => checkbox.value);
    console.log(`Selected diets: ${diets.join(', ')}`);

    // Retrieve the selected allergies
    const allergies = Array.from(document.querySelectorAll('input[name="allergies"]:checked')).map(checkbox => checkbox.value);
    console.log(`Selected allergies: ${allergies.join(', ')}`);

    // Retrieve the selected favorite breakfast dishes
    const favoriteBreakfastDishes = Array.from(document.querySelectorAll('input[name="favoriteBreakfast"]:checked')).map(checkbox => checkbox.value);
    console.log(`Selected Favorite Breakfast Dishes: ${favoriteBreakfastDishes.join(', ')}`);

    // Retrieve the selected favorite lunch items
    const favoriteLunchDishes = Array.from(document.querySelectorAll('input[name="favoriteLunch"]:checked')).map(checkbox => checkbox.value);
    console.log(`Selected Favorite Lunch Dishes: ${favoriteLunchDishes.join(', ')}`);

    // Retrieve the selected favorite dinner dishes
    const favoriteDinnerDishes = Array.from(document.querySelectorAll('input[name="favoriteDinner"]:checked')).map(checkbox => checkbox.value);
    console.log(`Selected Favorite Dinner Dishes: ${favoriteDinnerDishes.join(', ')}`);

    // Calculate calories 
    const totalCaloriesMin = parseFloat(document.getElementById('minCalories').value);
    const totalCaloriesMax = parseFloat(document.getElementById('maxCalories').value);

    const numMeals = selectedMeals.length;
    const mealCaloriesMin = totalCaloriesMin / numMeals;
    const mealCaloriesMax = totalCaloriesMax / numMeals;

    console.log(`Min calorie for the day: ${totalCaloriesMin.toFixed(2)} kcal`);
    console.log(`Max calorie for the day: ${totalCaloriesMax.toFixed(2)} kcal`);
    console.log(`Meal calorie range: ${mealCaloriesMin.toFixed(2)} - ${mealCaloriesMax.toFixed(2)} kcal`);

    const sections = {};

    // Rules for the meal sections
    if (selectedMeals.includes('Breakfast')) {
        sections['2.'] = {
            accept: {
                all: [
                    { dish: favoriteBreakfastDishes },
                    { meal: ['breakfast'] },
                    { health: allergies },
                    { health: diets } 
                ]
            },
            fit: { ENERC_KCAL: { min: mealCaloriesMin, max: mealCaloriesMax } }
        };
    }
    
    if (selectedMeals.includes('Lunch')) {
        sections['1.'] = {
            accept: {
                all: [
                    { dish: favoriteLunchDishes },
                    { meal: ['lunch'] },
                    { health: allergies },
                    { health: diets } 
                ]
            },
            fit: { ENERC_KCAL: { min: mealCaloriesMin, max: mealCaloriesMax } }
        };
    }
    
    if (selectedMeals.includes('Dinner')) {
        sections['0.'] = {
            accept: {
                all: [
                    { dish: favoriteDinnerDishes },
                    { meal: ['lunch/dinner'] }, 
                    { health: allergies },
                    { health: diets } 
                ]
            },
            fit: { ENERC_KCAL: { min: mealCaloriesMin, max: mealCaloriesMax } }
        };
    }
    
    console.log('Sections object:', sections);

    // Define requestBody
    const requestBody = {
        size: days,
        plan: {
            accept: { all: [] },
            fit: {},
            sections
        }
    };

    console.log('Request body:', requestBody);

    try {
        // API call using fetch
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': 'Basic YTZiZThlOGU6ZDZiM2JmOGM1NTNlNzVjZGM5OGZiN2NhYjA2Nzc1NzI=',
                'Edamam-Account-User': accountUser
            },
            body: JSON.stringify(requestBody)
        });

        console.log('API response:', response);

        // Parse the response
        const data = await response.json();
        console.log('Parsed response data:', data);

        // Process the meal plan data
        const selection = data.selection;
        console.log('Selection array:', selection);

        // Initialize the day counter
        let currentDay = 1;
        for (const item of selection) {
            console.log(`Day ${currentDay}`);
            const sections = item.sections;
            for (const meal in sections) {
                if (sections.hasOwnProperty(meal)) {
                    const assignedUrl = sections[meal].assigned;
                    console.log(`Meal: ${meal}, Assigned URL: ${assignedUrl}`);
                    const recipeID = extractRecipeID(assignedUrl);
                    console.log(`Extracted Recipe ID: ${recipeID}`);
                    await fetchRecipeInfo(recipeID, currentDay);
                }
            }

            currentDay++;
        }
    } catch (error) {
        // Handle errors
        const errorMessageContainer = document.getElementById('errorMessage');
        if (error.message.startsWith('Server error:')) {
            if (error.message.includes('400')) {
                errorMessageContainer.innerHTML = 'Bad Request: Please check your inputs.';
            } else if (error.message.includes('500')) {
                errorMessageContainer.innerHTML = 'Internal Server Error: Please try again later.';
            } else {
                errorMessageContainer.innerHTML = 'An error occurred. Please try again later.';
            }
        } else {
            // Other errors
            errorMessageContainer.innerHTML = 'An error occurred: ' + error.message;
        }
        console.error('Error creating meal plan:', error);
    } finally {
        // Hide loading spinner
        hideLoadingSpinner();
    }
}

// Function to extract recipe ID from URI
function extractRecipeID(uri) {
    const parts = uri.split('#');
    const recipeID = parts[1];
    console.log(`Extracted recipe ID from URI: ${recipeID}`);
    return recipeID;
}

// Function to fetch recipe info
async function fetchRecipeInfo(recipeID, currentDay) {
    
    // API credentials and endpoint
    const appId = 'a6be8e8e';
    const apiKey = 'd6b3bf8c553e75cdc98fb7cab0677572';
    const accountUser = 'jcv13';
    const url = `https://api.edamam.com/api/recipes/v2/${recipeID}?type=public&beta=true&app_id=${appId}&app_key=${apiKey}`;

    console.log(`Fetching recipe info from URL: ${url}`);

    try {
        // Make API call
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Edamam-Account-User': accountUser,
                'Accept-Language': 'en'
            }
        });

        console.log('Recipe info response:', response);

        // Parse the response
        const data = await response.json();
        console.log('Parsed recipe info data:', data);

        // Display the recipe information
        displayRecipeInfo(data, currentDay);
    } catch (error) {
        console.error('Error fetching recipe info:', error);
    }
}

// Function to display recipe information
function displayRecipeInfo(data,currentDay) {
    
    // Get the recipe information element
    const recipeInfoElement = document.getElementById('recipeInfo');

    const proteinPerServing = (data.recipe.totalNutrients.PROCNT.quantity / data.recipe.yield).toFixed(2);
    const fatPerServing = (data.recipe.totalNutrients.FAT.quantity / data.recipe.yield).toFixed(2);
    const carbsPerServing = (data.recipe.totalNutrients.CHOCDF.quantity / data.recipe.yield).toFixed(2);

    const proteinUnit = data.recipe.totalNutrients.PROCNT.unit;

    // Badge for protein/fat/carbohydrate content
    const proteinBadge = `<span class="badge bg-success">Protein: ${proteinPerServing} ${proteinUnit} per serving</span>`;
    const fatBadge = `<span class="badge bg-primary">Fat: ${fatPerServing} ${data.recipe.totalNutrients.FAT.unit} per serving</span>`;
    const carbBadge = `<span class="badge bg-warning text-dark">Carbohydrates: ${carbsPerServing} ${data.recipe.totalNutrients.CHOCDF.unit} per serving</span>`;
    
    // Card for each meal
    const dayContent = `
        <div class="col-md-4 mb-4"> 
            <div class="card h-100" style="border-radius: 10px;"> 
                <img src="${data.recipe.image}" class="card-img-top" alt="${data.recipe.label}">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title mb-3">Day ${currentDay}: ${data.recipe.label}</h5>
                    <div class="card-text row flex-grow-1 ">
                        <div class="col">
                            <span class="calories-per-serving">
                                <span class="servings">${data.recipe.yield} servings</span>
                                <span class="calories">${(data.recipe.totalNutrients.ENERC_KCAL.quantity / data.recipe.yield).toFixed(2)} kcal</span>
                            </span>
                        </div>
                        <div class="col mt-3">
                            ${proteinBadge}<br>
                            ${fatBadge}<br>
                            ${carbBadge}<br>
                        </div>
                    </div>
                    <a href="${data.recipe.shareAs}" class="card-link link-offset-2 link-underline link-underline-opacity-0 link-opacity-75-hover mt-3" target="_blank">
                        <i class="bi bi-book"></i> View Recipe
                    </a>
                </div>
            </div>
        </div>
    `;

    // Create a new row if its a new day
    let dayRow = document.querySelector(`#day${currentDay}`);
    if (!dayRow) {
        dayRow = document.createElement('div');
        dayRow.classList.add('row', 'mb-4');
        dayRow.id = `day${currentDay}`;
        recipeInfoElement.appendChild(dayRow);
    }

    dayRow.innerHTML += dayContent;
}

function showLoadingSpinner() {
    const spinner = document.createElement('div');
    spinner.classList.add('spinner-border', 'text-primary');
    spinner.setAttribute('role', 'status');

 
    const loadingText = document.createElement('strong');
    loadingText.textContent = 'Preparing your meal plan... ';
    loadingText.setAttribute('role', 'status');

    const container = document.getElementById('loadingContainer');
    container.innerHTML = ''; 

    container.appendChild(loadingText);
    container.appendChild(spinner);
}


// Function to hide loading spinner
function hideLoadingSpinner() {
    const container = document.getElementById('loadingContainer');
    container.innerHTML = ''; 
}

document.getElementById('mealPlanForm').addEventListener('submit', createMealPlan);

document.querySelector('.bootstrap-primary-btn').addEventListener('click', function() {
    const mealPlanDisplay = document.getElementById('mealPlanDisplay');
    mealPlanDisplay.style.display = (mealPlanDisplay.style.display === 'none') ? 'block' : 'none';
  });
  