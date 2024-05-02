async function fetchRecipeInfo(query) {
    showLoadingSpinner(); 

    console.log('Searching for:', query);  
    
    const appId = 'a6be8e8e';
    const apiKey = 'd6b3bf8c553e75cdc98fb7cab0677572';
    const url = `https://api.edamam.com/api/recipes/v2?type=public&beta=true&q=${encodeURIComponent(query)}&app_id=${appId}&app_key=${apiKey}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Edamam-Account-User': 'jcv13', 
                'Accept-Language': 'en' 
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch recipe info: ${response.statusText}`);
        }

        const data = await response.json();

        console.log('Recipe data:', data);

        const recipeInfoElement = document.getElementById('recipeInfo');

        // Check if any recipes are found
        if (data.hits && data.hits.length > 0) {
            recipeInfoElement.innerHTML = ''; 

            data.hits.forEach(hit => {
                const recipe = hit.recipe;

                const recipeName = recipe.label;
                const recipeCalories = recipe.totalNutrients.ENERC_KCAL.quantity;
                const recipeDescription = recipe.ingredientLines.join(', ');

                const recipeContainer = document.createElement('div');

                // Button to select the recipe
                const selectButton = document.createElement('button');
                selectButton.textContent = 'Select';
                selectButton.classList.add('btn', 'btn-primary', 'bootstrap-primary-btn', 'mb-5'); 
                selectButton.addEventListener('click', function() {
               
                    const recipeURI = recipe.uri;
                    const quantity = 1; 
                    console.log('Selected recipe:', recipeName); 
                    fetchShoppingList(recipeURI, quantity);
                });


                recipeContainer.innerHTML = `
                    <div class="card border-0 shadow-sm mb-4">
                        <div class="card-body">
                            <h2 class="card-title">${recipeName}</h2>
                            <p class="card-text"><i class="bi bi-calories"></i> Calories: ${recipeCalories.toFixed(2)} kcal</p>
                            <p class="card-text"><i class="bi bi-globe"></i> Cuisine Type: ${recipe.cuisineType}</p>
                            <p class="card-text"><i class="bi bi-egg"></i> Diet Labels: ${recipe.dietLabels.join(', ')}</p>
                            <p class="card-text"><i class="bi bi-collection"></i> Dish Type: ${recipe.dishType.join(', ')}</p>
                            <p class="card-text"><i class="bi bi-heart-fill"></i> Health Labels: ${recipe.healthLabels.join(', ')}</p>
                            <p class="card-text"><i class="bi bi-clock"></i> Meal Type: ${recipe.mealType.join(', ')}</p>
                            <p class="card-text"><i class="bi bi-clock-history"></i> Total Time: ${recipe.totalTime} minutes</p>
                            <p class="card-text"><i class="bi bi-people"></i> Yield: ${recipe.yield}</p>
                            <p class="card-text">Source: <a href="${recipe.url}" class="text-decoration-none" target="_blank">${recipe.source}</a></p>
                        </div>
                    </div>
                `;
                
                recipeContainer.appendChild(selectButton);

            
                recipeInfoElement.appendChild(recipeContainer);
            });
        } else {
            recipeInfoElement.innerHTML = '<p class="text-center text-secondary">No recipes found!</p>';
        }

        hideLoadingSpinner();

    } catch (error) {
        console.error('Error fetching recipe info:', error);

        hideLoadingSpinner();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const recipeSearchForm = document.getElementById('recipeSearchForm');

    recipeSearchForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const query = document.getElementById('recipeSearchInput').value;
        console.log('Submitting query:', query); 
        
        fetchRecipeInfo(query);
    });
});

// Function to fetch the shopping list
async function fetchShoppingList(recipeURI, quantity) {
    console.log('Fetching shopping list for recipe:', recipeURI); 
    console.log('Quantity:', quantity); 

    const url = 'https://api.edamam.com/api/meal-planner/v1/a6be8e8e/shopping-list';
    const authToken = btoa('a6be8e8e:d6b3bf8c553e75cdc98fb7cab0677572'); 

    const requestBody = {
        entries: [
            {
                quantity: quantity,
                recipe: recipeURI
            }
        ]
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Edamam-Account-User': 'jcv13',
                'Authorization': `Basic ${authToken}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch shopping list: ${response.statusText}`);
        }

        const data = await response.json();

        console.log('Shopping list:', data); 

        displayShoppingList(data);

    } catch (error) {
        console.error('Error fetching shopping list:', error);
    }
}

function displayShoppingList(data) {
    const shoppingListElement = document.getElementById('shoppingList');
    shoppingListElement.innerHTML = ''; 

    const listContainer = document.createElement('ul');
    listContainer.classList.add('list-group', 'list-group-flush'); 

    data.entries.forEach(entry => {
        const listItem = document.createElement('li');
        listItem.classList.add('list-group-item','list-group-item-action'); 

        const foodItem = entry.foodItem.split('#')[1];
        const quantity = entry.quantities[0].quantity.toFixed(2); 
        const measure = entry.quantities[0].measure.split('#')[1]; 

       
        const measureUnitMap = {
            "Measure_unit": "unit",
            "Measure_gram": "gram",
            "Measure_milliliter": "milliliter"
         
        };

        const formattedMeasure = measureUnitMap[measure] || measure;

        // Remove "Food_" from the food item
        const formattedFoodItem = foodItem.substring(5)
            .split('_') 
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' '); 

        listItem.textContent = `${quantity} ${formattedMeasure} of ${formattedFoodItem}`;
        listContainer.appendChild(listItem);
    });

    shoppingListElement.appendChild(listContainer);
}


function showLoadingSpinner() {
    
    const spinner = document.createElement('div');
    spinner.classList.add('spinner-border', 'text-primary');
    spinner.setAttribute('role', 'status');

    const loadingText = document.createElement('strong');
    loadingText.textContent = 'Fetching recipe information...';
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

const recipeListSection = document.getElementById('recipeListSection');

document.getElementById('recipeSearchForm').addEventListener('submit', function(event) {
  event.preventDefault(); 

  recipeListSection.classList.remove('d-none');

  fetchRecipeInfo(document.getElementById('recipeSearchInput').value);
});
