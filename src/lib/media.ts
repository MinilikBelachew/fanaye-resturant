export const DISH_IMAGES = {
    pasta: "/media/pasta.jpg",
    burger: "/media/burger.jpg",
    pizza: "/media/pizza.jpg",
    salad: "/media/salad.jpg",
    macchiato: "/media/macchiato.jpg",
    latte: "/media/latte.jpg",
    cheesecake: "/media/cheesecake.jpg",
    tiramisu: "/media/tiramisu.jpg",
    cola: "/media/cola.jpg",
    sprite: "/media/sprite.jpg",
} as const;

export type DishImageKey = keyof typeof DISH_IMAGES;
