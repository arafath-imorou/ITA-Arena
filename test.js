const text = `Placement "Front Row" - Une vue imprenable, sans obstacle. Vous êtes aux premières loges. Le "Goodie Bag" Premium - Un sac cadeau exclusif contenant des surprises de nos partenaires de luxe.`;

const regex = /([A-Z][\wÀ-ÿ\s"']{2,40}(?:\s-\s|\s:\s))/g;
console.log(text.split(regex));
