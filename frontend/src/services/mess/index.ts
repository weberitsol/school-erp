// Mess Management Services

// Phase 1: Foundation & Core Data
export { messService, type Mess, type CreateMessDto } from './mess.service';
export { foodItemService, type FoodItem, type CreateFoodItemDto } from './food-item.service';
export { allergenService, type Allergen, type CreateAllergenDto, type AllergenSeverity } from './allergen.service';
export { recipeService, type Recipe, type CreateRecipeDto, type MealVariantType } from './recipe.service';
export { mealPlanService, type MealPlan, type CreateMealPlanDto } from './meal-plan.service';
export { messStaffService, type MessStaff, type CreateMessStaffDto } from './mess-staff.service';

// Phase 2: Critical Safety Systems
export { studentAllergyService, type StudentAllergy, type CreateStudentAllergyDto } from './student-allergy.service';
export { allergenCheckerService, type AllergenCheckResult } from './allergen-checker.service';
export { kitchenHygieneService, type KitchenHygieneChecklist, type CreateKitchenHygieneDto } from './kitchen-hygiene.service';
export { menuApprovalService, type MenuApproval } from './menu-approval.service';

// Phase 3: Menu Planning & Meal Management
export { menuService, type Menu, type CreateMenuDto } from './menu.service';
export { mealService, type Meal, type CreateMealDto } from './meal.service';
export { mealVariantService, type MealVariant, type CreateMealVariantDto } from './meal-variant.service';
export { mealChoiceService, type StudentMealChoice, type CreateMealChoiceDto, type AvailableVariants } from './meal-choice.service';
