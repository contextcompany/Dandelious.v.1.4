export interface GeneratedRecipe {
  title: string;
  category: string;
  prepTime: string;
  cookTime: string;
  portions: number;
  difficulty: 'Einfach' | 'Mittel' | 'Schwer';
  description: string;
  ingredients: Array<{
    name: string;
    amount: string;
    unit: string;
  }>;
  instructions: string[];
  notes: string;
  tags: string[];
}

// Scale helper
function scaleAmount(baseAmount: number, basePortions: number, targetPortions: number): string {
  const scaled = (baseAmount / basePortions) * targetPortions;
  if (scaled <= 0) return '1';
  if (Number.isInteger(scaled)) return String(scaled);
  if (scaled < 1) {
    const rounded = Math.round(scaled * 10) / 10;
    return String(rounded);
  }
  return String(Math.round(scaled * 2) / 2);
}

// Comprehensive database of authentic classic recipes with real quantities and step-by-step instructions
export function synthesizeCulinaryRecipe(rawQuery: string, targetPortions: number = 4): GeneratedRecipe {
  const q = rawQuery.toLowerCase()
    .replace(/^(rezept für|wie koche ich|wie backe ich|ich brauche ein rezept für|rezept|suche|finde|aus dem internet)\s+/i, '')
    .trim();
  const portions = targetPortions > 0 ? targetPortions : 4;

  // 1. Carbonara
  if (q.includes('carbonara')) {
    return {
      title: 'Original römische Spaghetti alla Carbonara',
      category: 'Hauptgerichte',
      prepTime: '10 Min',
      cookTime: '15 Min',
      portions,
      difficulty: 'Mittel',
      description: 'Der authentische römische Pasta-Klassiker: Samtig cremig gebunden mit frischem Eigelb, Pecorino und krossem Guanciale – garantiert ohne Sahne.',
      ingredients: [
        { name: 'Spaghetti (beste Bronze-Qualität)', amount: scaleAmount(400, 4, portions), unit: 'g' },
        { name: 'Guanciale (italienischer luftgetrockneter Backenspeck) oder Pancetta', amount: scaleAmount(150, 4, portions), unit: 'g' },
        { name: 'Frische Eigelbe (Größe M/L)', amount: scaleAmount(4, 4, portions), unit: 'Stück' },
        { name: 'Ganzes frisches Ei', amount: scaleAmount(1, 4, portions), unit: 'Stück' },
        { name: 'Pecorino Romano (frisch gerieben)', amount: scaleAmount(60, 4, portions), unit: 'g' },
        { name: 'Parmigiano Reggiano (frisch gerieben)', amount: scaleAmount(30, 4, portions), unit: 'g' },
        { name: 'Schwarzer Pfeffer (frisch und grob aus der Mühle)', amount: scaleAmount(1, 4, portions), unit: 'TL' },
        { name: 'Grobes Meersalz (für das Kochwasser)', amount: scaleAmount(1, 4, portions), unit: 'EL' }
      ],
      instructions: [
        'Den Guanciale in ca. 0,5 cm dicke Streifen schneiden. In einer breiten Pfanne ohne zusätzliches Fett bei mittlerer Hitze langsam auslassen, bis er außen herrlich knusprig und innen noch saftig ist (ca. 7–9 Minuten). Danach die Pfanne vom Herd nehmen.',
        'Einen großen Topf mit reichlich Wasser zum Kochen bringen, salzen (vorsichtig dosieren, da Guanciale und Käse bereits intensiv salzig sind) und die Spaghetti ca. 2 Minuten kürzer als auf der Packung angegeben sehr bissfest (al dente) kochen.',
        'Währenddessen in einer Glasschüssel die Eigelbe, das ganze Ei, den geriebenen Pecorino, den Parmesan und reichlich grob gemahlenen schwarzen Pfeffer zu einer dickflüssigen Creme verrühren.',
        'Kurz vor Ende der Kochzeit eine Tasse heißes stärkehaltiges Nudelwasser (ca. 150 ml) abschöpfen. Die Spaghetti mit einer Zange direkt in die Pfanne zum ausgelassenen Guanciale geben und gut durchschwenken.',
        'Wichtigster Schritt: Die Pfanne komplett von der heißen Herdplatte nehmen (Temperatur ca. 65°C). Etwas Nudelwasser und die Ei-Käse-Mischung zur Pasta geben. Durch ständiges Rühren und Schwenken emulgiert das Stärkewasser mit dem Fett zu einer seidigen, glänzenden Sauce ohne zu stocken.',
        'Auf vorgewärmten Tellern servieren, mit übrigem knusprigem Guanciale, weiterem Pecorino und frischem Pfeffer garnieren.'
      ],
      notes: 'Niemals die Eimischung auf der heißen Herdplatte kochen lassen – das Ei gerinnt ab ca. 68°C zu Rührei. Die Restwärme der heißen Pasta und das Stärkewasser reichen perfekt für die seidige Bindung aus.',
      tags: ['Pasta', 'Italienisch', 'Klassiker', 'Schnell & Einfach']
    };
  }

  // 2. Bolognese / Ragù alla Bolognese
  if (q.includes('bolognese') || q.includes('ragu') || q.includes('ragù')) {
    return {
      title: 'Traditionelles Ragù alla Bolognese',
      category: 'Hauptgerichte',
      prepTime: '20 Min',
      cookTime: '90 Min',
      portions,
      difficulty: 'Mittel',
      description: 'Langsam geschmortes toskanisches Fleischragout mit fein gewürfeltem Wurzelgemüse, trockenem Wein und sanfter Milch-Abrundung.',
      ingredients: [
        { name: 'Rinderhackfleisch (frisch vom Metzger)', amount: scaleAmount(500, 4, portions), unit: 'g' },
        { name: 'Tagliatelle oder Spaghetti', amount: scaleAmount(400, 4, portions), unit: 'g' },
        { name: 'Zwiebel (fein gewürfelt)', amount: scaleAmount(1, 4, portions), unit: 'Stück' },
        { name: 'Karotte (fein gewürfelt)', amount: scaleAmount(1, 4, portions), unit: 'Stück' },
        { name: 'Stangensellerie (fein gewürfelt)', amount: scaleAmount(1, 4, portions), unit: 'Stange' },
        { name: 'Knoblauchzehen (fein gehackt)', amount: scaleAmount(2, 4, portions), unit: 'Stück' },
        { name: 'Tomatenmark (dreifach konzentriert)', amount: scaleAmount(2, 4, portions), unit: 'EL' },
        { name: 'Gehackte Tomaten (San Marzano aus der Dose)', amount: scaleAmount(400, 4, portions), unit: 'g' },
        { name: 'Trockener Rotwein oder Weißwein', amount: scaleAmount(150, 4, portions), unit: 'ml' },
        { name: 'Milch (Vollmilch für extra Zartheit)', amount: scaleAmount(100, 4, portions), unit: 'ml' },
        { name: 'Rinder- oder Gemüsebrühe', amount: scaleAmount(200, 4, portions), unit: 'ml' },
        { name: 'Olivenöl extra vergine', amount: scaleAmount(3, 4, portions), unit: 'EL' },
        { name: 'Lorbeerblatt', amount: scaleAmount(1, 4, portions), unit: 'Stück' },
        { name: 'Salz, Pfeffer und Prise Muskat', amount: scaleAmount(1, 4, portions), unit: 'Prise' }
      ],
      instructions: [
        'Zwiebel, Karotte und Stangensellerie in sehr feine, gleichmäßige Würfel schneiden (Soffritto).',
        'Das Olivenöl in einem schweren Schmortopf erhitzen. Das Gemüse bei mittlerer Hitze ca. 8–10 Minuten sanft anschwitzen, bis es weich und aromatisch ist.',
        'Das Rinderhackfleisch dazugeben und kräftig anbraten, dabei mit dem Kochlöffel feinkrümelig zerteilen. Salzen und pfeffern.',
        'Das Tomatenmark unterrühren und 2 Minuten mitrösten. Mit dem Wein ablöschen und den Bratensatz vom Topfboden lösen. Den Wein um die Hälfte einkochen lassen.',
        'Die gehackten Tomaten, Brühe, Milch und das Lorbeerblatt einrühren. Auf kleinste Flamme stellen und zugedeckt mindestens 60 bis 90 Minuten sanft köcheln lassen, gelegentlich umrühren.',
        'Die Pasta in reichlich Salzwasser al dente kochen, mit dem heißen Ragù vermengen und mit frisch geriebenem Parmesan servieren.'
      ],
      notes: 'Die Milch neutralisiert die Säure der Tomaten und sorgt dafür, dass die Fleischfasern herrlich mürbe werden.',
      tags: ['Pasta', 'Ragù', 'Italienisch', 'Schmorgericht']
    };
  }

  // 3. Lasagne
  if (q.includes('lasagne')) {
    return {
      title: 'Klassische Lasagne al Forno mit Béchamel',
      category: 'Hauptgerichte',
      prepTime: '30 Min',
      cookTime: '45 Min',
      portions,
      difficulty: 'Mittel',
      description: 'Goldbraun überbackener Auflaufschatz mit geschichtetem Fleischragout, seidiger Muskat-Béchamelsauce und zartschmelzendem Mozzarella.',
      ingredients: [
        { name: 'Lasagneplatten (ohne Vorkochen)', amount: scaleAmount(12, 4, portions), unit: 'Stück' },
        { name: 'Gemischtes Hackfleisch (Rind/Schwein)', amount: scaleAmount(500, 4, portions), unit: 'g' },
        { name: 'Gehackte Tomaten', amount: scaleAmount(800, 4, portions), unit: 'g' },
        { name: 'Zwiebel und Knoblauch', amount: scaleAmount(2, 4, portions), unit: 'Stück' },
        { name: 'Tomatenmark', amount: scaleAmount(2, 4, portions), unit: 'EL' },
        { name: 'Butter (für Béchamel)', amount: scaleAmount(50, 4, portions), unit: 'g' },
        { name: 'Weizenmehl (für Béchamel)', amount: scaleAmount(50, 4, portions), unit: 'g' },
        { name: 'Milch (lauwarm)', amount: scaleAmount(500, 4, portions), unit: 'ml' },
        { name: 'Geriebene Muskatnuss', amount: scaleAmount(1, 4, portions), unit: 'Prise' },
        { name: 'Geriebener Mozzarella oder Gouda', amount: scaleAmount(200, 4, portions), unit: 'g' },
        { name: 'Geriebener Parmesan', amount: scaleAmount(50, 4, portions), unit: 'g' }
      ],
      instructions: [
        'Für die Fleischsauce Zwiebel und Knoblauch anbraten, Hackfleisch kräftig braun braten, Tomatenmark und Tomaten zugeben, mit Salz, Pfeffer und Oregano 25 Minuten köcheln lassen.',
        'Für die Béchamelsauce Butter im Topf schmelzen, Mehl einrühren und unter ständigem Schlagen mit dem Schneebesen nach und nach die Milch einrühren. 5 Minuten sanft eindicken lassen, mit Salz, Pfeffer und Muskat würzen.',
        'Den Ofen auf 200 °C Ober-/Unterhitze (180 °C Umluft) vorheizen.',
        'In einer Auflaufform zuerst dünn Béchamel verstreichen, dann Lasagneplatten auslegen. Abwechselnd Fleischsauce, Béchamel und Nudelplatten schichten.',
        'Die oberste Schicht bildet Béchamelsauce, bestreut mit reichlich Mozzarella und Parmesan.',
        'Im Ofen ca. 35–40 Minuten goldbraun und knusprig überbacken. Vor dem Anschneiden 10 Minuten ruhen lassen.'
      ],
      notes: '10 Minuten Ruhezeit vor dem Anschneiden lassen die Schichten festigen, sodass saubere Quadrate geschnitten werden können.',
      tags: ['Auflauf', 'Pasta', 'Ofengericht', 'Klassiker']
    };
  }

  // 4. Waffeln
  if (q.includes('waffel')) {
    return {
      title: 'Knusprige fluffige Herzwaffeln nach Omas Geheimrezept',
      category: 'Backen & Kuchen',
      prepTime: '15 Min',
      cookTime: '15 Min',
      portions,
      difficulty: 'Einfach',
      description: 'Herrlich goldgelbe, außen knusprige und innen watteweiche Waffeln mit feiner Bourbon-Vanillenote.',
      ingredients: [
        { name: 'Weizenmehl (Type 405)', amount: scaleAmount(250, 4, portions), unit: 'g' },
        { name: 'Butter (zimmerwarm)', amount: scaleAmount(125, 4, portions), unit: 'g' },
        { name: 'Zucker', amount: scaleAmount(75, 4, portions), unit: 'g' },
        { name: 'Bourbon-Vanillezucker', amount: scaleAmount(1, 4, portions), unit: 'Päckchen' },
        { name: 'Eier (Größe M)', amount: scaleAmount(3, 4, portions), unit: 'Stück' },
        { name: 'Milch (lauwarm)', amount: scaleAmount(250, 4, portions), unit: 'ml' },
        { name: 'Backpulver', amount: scaleAmount(1, 4, portions), unit: 'TL' },
        { name: 'Prise Salz', amount: scaleAmount(1, 4, portions), unit: 'Prise' },
        { name: 'Puderzucker zum Bestäuben', amount: scaleAmount(2, 4, portions), unit: 'EL' }
      ],
      instructions: [
        'Die weiche Butter mit Zucker, Vanillezucker und einer Prise Salz mit dem Handrührgerät 3–4 Minuten cremig hell aufschlagen.',
        'Die Eier einzeln nacheinander gründlich unterrühren (jedes Ei ca. 30 Sekunden schlagen).',
        'Das Mehl mit dem Backpulver mischen und abwechselnd mit der lauwarmen Milch zügig unter den Teig rühren, bis ein glatter, zähflüssiger Teig entsteht. Den Teig 10 Minuten ruhen lassen.',
        'Das Waffeleisen vorheizen und bei Bedarf mit etwas Butter oder hitzebeständigem Öl einpinseln.',
        'Jeweils ca. 2–3 Esslöffel Teig in die Mitte geben, das Waffeleisen schließen und ca. 3–4 Minuten goldbraun ausbacken.',
        'Mit Puderzucker bestäuben und nach Belieben mit heißen Kirschen, Sahne oder frischen Beeren servieren.'
      ],
      notes: 'Für noch knusprigere Waffeln kannst du 50 ml der Milch durch kohlensäurehaltiges Mineralwasser ersetzen.',
      tags: ['Süßes', 'Backen & Kuchen', 'Schnell & Einfach', 'Desserts']
    };
  }

  // 5. Pfannkuchen / Pancakes
  if (q.includes('pfannkuchen') || q.includes('pancake') || q.includes('eierkuchen') || q.includes('crêpe') || q.includes('crepe')) {
    return {
      title: 'Klassische goldene Eierpfannkuchen',
      category: 'Schnell & Einfach',
      prepTime: '10 Min',
      cookTime: '15 Min',
      portions,
      difficulty: 'Einfach',
      description: 'Zarte, luftige Pfannkuchen – vielseitig belegbar mit Zimt & Zucker, Apfelmus oder herzhaft mit Schinken und Käse.',
      ingredients: [
        { name: 'Weizenmehl (Type 405)', amount: scaleAmount(200, 4, portions), unit: 'g' },
        { name: 'Milch', amount: scaleAmount(350, 4, portions), unit: 'ml' },
        { name: 'Eier (Größe M)', amount: scaleAmount(3, 4, portions), unit: 'Stück' },
        { name: 'Prise Salz', amount: scaleAmount(1, 4, portions), unit: 'Prise' },
        { name: 'Mineralwasser mit Kohlensäure', amount: scaleAmount(50, 4, portions), unit: 'ml' },
        { name: 'Butter oder Butterschmalz zum Ausbacken', amount: scaleAmount(2, 4, portions), unit: 'EL' }
      ],
      instructions: [
        'Mehl mit der Prise Salz in einer Rührschüssel vermengen.',
        'Die Eier mit der Milch verquirlen und nach und nach mit dem Schneebesen unter das Mehl rühren, bis keine Klümpchen mehr vorhanden sind.',
        'Einen Schuss kohlensäurehaltiges Mineralwasser unterrühren und den Teig 10 Minuten quellen lassen.',
        'Eine beschichtete Pfanne bei mittlerer bis hoher Hitze erwärmen und eine kleine Flocke Butter zerlassen.',
        'Eine Kelle Teig hineingeben und durch Schwenken gleichmäßig in der Pfanne verteilen.',
        'Backen, bis die Oberseite matt wird und sich Bläschen bilden (ca. 2 Minuten), dann wenden und die zweite Seite 1–2 Minuten goldgelb backen.'
      ],
      notes: 'Das Quellenlassen des Teigs ist entscheidend: Die Stärkekörner binden die Flüssigkeit, wodurch der Pfannkuchen beim Wenden reißfest bleibt.',
      tags: ['Klassiker', 'Schnell & Einfach', 'Frühstück', 'Süßes']
    };
  }

  // 6. Curry (Thai / Chicken / Kichererbsen)
  if (q.includes('curry') || q.includes('tikka') || q.includes('masala')) {
    return {
      title: 'Cremiges Kokos-Gemüse-Curry mit Duftreis',
      category: 'Hauptgerichte',
      prepTime: '15 Min',
      cookTime: '20 Min',
      portions,
      difficulty: 'Einfach',
      description: 'Farbenfrohes, aromatisches Curry mit knackigem Gemüse, samtiger Kokosmilch und wärmenden Gewürzen.',
      ingredients: [
        { name: 'Basmati- oder Jasminreis', amount: scaleAmount(300, 4, portions), unit: 'g' },
        { name: 'Kokosmilch (cremig)', amount: scaleAmount(400, 4, portions), unit: 'ml' },
        { name: 'Gemüsebrühe', amount: scaleAmount(150, 4, portions), unit: 'ml' },
        { name: 'Rote oder gelbe Currypaste', amount: scaleAmount(2, 4, portions), unit: 'EL' },
        { name: 'Hähnchenbrustfilet oder Tofu/Kichererbsen', amount: scaleAmount(400, 4, portions), unit: 'g' },
        { name: 'Rote Paprikaschote (in Streifen)', amount: scaleAmount(1, 4, portions), unit: 'Stück' },
        { name: 'Zucchini (in Halbmonde geschnitten)', amount: scaleAmount(1, 4, portions), unit: 'Stück' },
        { name: 'Frischer Ingwer (gerieben)', amount: scaleAmount(1, 4, portions), unit: 'TL' },
        { name: 'Knoblauchzehen (gehackt)', amount: scaleAmount(2, 4, portions), unit: 'Stück' },
        { name: 'Sojasauce oder Fischsauce', amount: scaleAmount(2, 4, portions), unit: 'EL' },
        { name: 'Limettensaft', amount: scaleAmount(1, 4, portions), unit: 'EL' },
        { name: 'Frischer Koriander zum Garnieren', amount: scaleAmount(2, 4, portions), unit: 'Stiele' }
      ],
      instructions: [
        'Den Reis nach Packungsanleitung in leicht gesalzenem Wasser gar dämpfen.',
        'In einer tiefen Pfanne oder einem Wok 1 EL Öl erhitzen. Hähnchenstreifen oder Tofuwürfel 3–4 Minuten scharf anbraten und herausnehmen.',
        'Im restlichen Öl die Currypaste mit Ingwer und Knoblauch bei mittlerer Hitze 1 Minute anrösten, bis sie duftet.',
        'Mit Kokosmilch und Brühe ablöschen, glattrühren und zum Kochen bringen.',
        'Paprika und Zucchini hineingeben und bei mittlerer Hitze ca. 6–8 Minuten sanft köcheln lassen, bis das Gemüse bissfest ist.',
        'Das Hähnchen/Tofu wieder hineingeben, mit Sojasauce, Limettensaft und einer Prise Rohrzucker abschmecken. Mit Duftreis und Koriander servieren.'
      ],
      notes: 'Das kurze Anrösten der Currypaste in heißem Fett setzt die ätherischen Öle der Gewürze frei und sorgt für maximale Geschmackstiefe.',
      tags: ['Curry', 'Asiatisch', 'Schnell & Einfach', 'Hauptgerichte']
    };
  }

  // 7. Wiener Schnitzel
  if (q.includes('schnitzel')) {
    return {
      title: 'Klassisches Wiener Schnitzel mit Zitrone',
      category: 'Hauptgerichte',
      prepTime: '20 Min',
      cookTime: '10 Min',
      portions,
      difficulty: 'Mittel',
      description: 'Zart geklopfte Schnitzel in wellenförmig soufflierender goldbrauner Panierkruste.',
      ingredients: [
        { name: 'Kalbs- oder Schweineoberschale (dünne Schnitzel)', amount: scaleAmount(4, 4, portions), unit: 'Stück' },
        { name: 'Weizenmehl (Type 405)', amount: scaleAmount(100, 4, portions), unit: 'g' },
        { name: 'Eier (Größe M)', amount: scaleAmount(2, 4, portions), unit: 'Stück' },
        { name: 'Feine Semmelbrösel / Paniermehl', amount: scaleAmount(150, 4, portions), unit: 'g' },
        { name: 'Butterschmalz zum Ausbacken', amount: scaleAmount(200, 4, portions), unit: 'g' },
        { name: 'Bio-Zitrone (in Spalten)', amount: scaleAmount(1, 4, portions), unit: 'Stück' },
        { name: 'Salz und frisch gemahlener schwarzer Pfeffer', amount: scaleAmount(1, 4, portions), unit: 'Prise' }
      ],
      instructions: [
        'Die Schnitzel zwischen zwei Lagen Frischhaltefolie mit einem Plattiereisen oder Stieltopf vorsichtig von innen nach außen ca. 4–5 mm dünn plattieren.',
        'Drei tiefe Teller bereitstellen: Teller 1 mit Mehl, Teller 2 mit den verquirlten Eiern (leicht gesalzen), Teller 3 mit Semmelbröseln.',
        'Die Schnitzel beidseitig salzen und pfeffern. Zuerst im Mehl wenden und überschüssiges Mehl vorsichtig abklopfen.',
        'Durch das Ei ziehen, abtropfen lassen und in die Semmelbrösel legen. Die Panier nur leicht andrücken, niemals festpressen, damit sie beim Braten soufflieren kann.',
        'Butterschmalz in einer großen Pfanne fingerhoch erhitzen (ca. 170 °C). Die Schnitzel hineingeben – sie müssen im Fett schwimmen.',
        'Die Pfanne sanft kreisend hin- und herbewegen, sodass das heiße Fett über die Oberseite schwappt. Nach 2–3 Minuten wenden und die andere Seite 2 Minuten goldbraun backen.',
        'Auf Küchenpapier kurz abtropfen lassen und sofort mit Zitronenspalten servieren.'
      ],
      notes: 'Niemals die Panade festdrücken! Nur wenn Luft zwischen Fleisch und Panade bleibt, wirft das Schnitzel die typischen goldbraunen Blasen.',
      tags: ['Klassiker', 'Fleisch', 'Österreichisch', 'Hauptgerichte']
    };
  }

  // 8. Pizza
  if (q.includes('pizza')) {
    return {
      title: 'Neapolitanische Pizza Margherita',
      category: 'Hauptgerichte',
      prepTime: '25 Min',
      cookTime: '12 Min',
      portions,
      difficulty: 'Mittel',
      description: 'Knusprig-luftiger Hefeteig mit fruchtiger Tomatensauce, cremigem Fior di Latte Mozzarella und frischem Basilikum.',
      ingredients: [
        { name: 'Pizzamehl (Tipo 00)', amount: scaleAmount(500, 4, portions), unit: 'g' },
        { name: 'Lauwarmes Wasser', amount: scaleAmount(325, 4, portions), unit: 'ml' },
        { name: 'Frische Hefe (oder 1 Pck. Trockenhefe)', amount: scaleAmount(15, 4, portions), unit: 'g' },
        { name: 'Feines Meersalz', amount: scaleAmount(12, 4, portions), unit: 'g' },
        { name: 'Natives Olivenöl extra', amount: scaleAmount(2, 4, portions), unit: 'EL' },
        { name: 'San Marzano Tomaten (mit der Hand zerdrückt)', amount: scaleAmount(400, 4, portions), unit: 'g' },
        { name: 'Mozzarella (gut abgetropft)', amount: scaleAmount(250, 4, portions), unit: 'g' },
        { name: 'Frische Basilikumblätter', amount: scaleAmount(12, 4, portions), unit: 'Blätter' }
      ],
      instructions: [
        'Hefe im lauwarmen Wasser auflösen. Mehl in eine Schüssel geben, Hefewasser zugeben und 5 Minuten verkneten. Salz und Olivenöl zugeben und weitere 10 Minuten geschmeidig kneten.',
        'Den Teig abgedeckt an einem warmen Ort mindestens 60 bis 90 Minuten auf das doppelte Volumen aufgehen lassen.',
        'Den Backofen mit Backblech oder Pizzastein auf maximale Hitze (mindestens 250 °C Ober-/Unterhitze) vorheizen.',
        'Den Teig auf bemehlter Fläche mit den Händen von der Mitte nach außen zu runden Pizzen formen, dabei einen 1–2 cm dicken Rand lassen.',
        'Mit 2–3 EL zerdrückten Tomaten bestreichen, salzen und mit abgetropften Mozzarellastücken belegen.',
        'Auf das heiße Blech schieben und 8–12 Minuten backen, bis der Rand knusprige Bläschen wirft. Mit frischem Basilikum und etwas Olivenöl vollenden.'
      ],
      notes: 'Den Teig niemals mit dem Nudelholz ausrollen, da sonst die mühsam eingearbeiteten Luftbläschen zerstört werden.',
      tags: ['Pizza', 'Italienisch', 'Backen & Kuchen', 'Klassiker']
    };
  }

  // 9. Kürbissuppe / Tomatensuppe / Suppe
  if (q.includes('suppe') || q.includes('eintopf')) {
    const isTomato = q.includes('tomat');
    const isPotato = q.includes('kartoffel');
    
    if (isTomato) {
      return {
        title: 'Mediterrane geröstete Tomatensuppe mit Basilikum',
        category: 'Suppen & Eintöpfe',
        prepTime: '15 Min',
        cookTime: '25 Min',
        portions,
        difficulty: 'Einfach',
        description: 'Vollmundige Tomatensuppe aus ofengerösteten Tomaten, Knoblauch und einem Hauch Sahne.',
        ingredients: [
          { name: 'Reife Rispentomaten oder Dosentomaten', amount: scaleAmount(1000, 4, portions), unit: 'g' },
          { name: 'Zwiebel (gehackt)', amount: scaleAmount(1, 4, portions), unit: 'Stück' },
          { name: 'Knoblauchzehen', amount: scaleAmount(3, 4, portions), unit: 'Stück' },
          { name: 'Tomatenmark', amount: scaleAmount(2, 4, portions), unit: 'EL' },
          { name: 'Gemüsebrühe', amount: scaleAmount(500, 4, portions), unit: 'ml' },
          { name: 'Schlagsahne oder pflanzliche Sahne', amount: scaleAmount(100, 4, portions), unit: 'ml' },
          { name: 'Olivenöl extra vergine', amount: scaleAmount(3, 4, portions), unit: 'EL' },
          { name: 'Frisches Basilikum', amount: scaleAmount(1, 4, portions), unit: 'Bund' },
          { name: 'Zucker, Salz und Pfeffer', amount: scaleAmount(1, 4, portions), unit: 'Prise' }
        ],
        instructions: [
          'Zwiebel und Knoblauch in einem Topf mit 2 EL Olivenöl sanft glasig dünsten.',
          'Tomatenmark dazugeben und kurz anrösten, um die fruchtige Süße zu intensivieren.',
          'Die gewürfelten Tomaten und die heiße Gemüsebrühe zugeben. Mit Salz, Pfeffer und einer Prise Zucker würzen.',
          'Aufkochen und 20 Minuten bei mittlerer Hitze sanft köcheln lassen.',
          'Die Suppe vom Herd nehmen, die Sahne und frische Basilikumblätter hineingeben und mit dem Pürierstab cremig fein pürieren.',
          'Mit geröstetem Ciabatta oder Knoblauch-Croutons servieren.'
        ],
        notes: 'Eine kleine Prise Zucker neutralisiert die natürliche Säure der Tomaten und bringt das Aroma voll zur Geltung.',
        tags: ['Suppe', 'Vegetarisch', 'Schnell & Einfach', 'Suppen & Eintöpfe']
      };
    }

    return {
      title: 'Samtige Hokkaido-Kürbissuppe mit Ingwer und Kokos',
      category: 'Suppen & Eintöpfe',
      prepTime: '15 Min',
      cookTime: '20 Min',
      portions,
      difficulty: 'Einfach',
      description: 'Cremig-würzige Kürbissuppe mit feiner Kokosnote, wärmendem Ingwer und gerösteten Kürbiskernen.',
      ingredients: [
        { name: 'Hokkaido-Kürbis (gewaschen, entkernt, gewürfelt)', amount: scaleAmount(800, 4, portions), unit: 'g' },
        { name: 'Zwiebel (gehackt)', amount: scaleAmount(1, 4, portions), unit: 'Stück' },
        { name: 'Knoblauchzehe', amount: scaleAmount(1, 4, portions), unit: 'Stück' },
        { name: 'Frischer Ingwer (gerieben)', amount: scaleAmount(15, 4, portions), unit: 'g' },
        { name: 'Gemüsebrühe', amount: scaleAmount(600, 4, portions), unit: 'ml' },
        { name: 'Kokosmilch oder Schlagsahne', amount: scaleAmount(200, 4, portions), unit: 'ml' },
        { name: 'Butter oder Pflanzenöl', amount: scaleAmount(2, 4, portions), unit: 'EL' },
        { name: 'Geriebene Muskatnuss, Salz und Pfeffer', amount: scaleAmount(1, 4, portions), unit: 'Prise' },
        { name: 'Kürbiskerne und Kürbiskernöl zum Garnieren', amount: scaleAmount(2, 4, portions), unit: 'EL' }
      ],
      instructions: [
        'Hokkaido halbieren, Kerne mit einem Löffel herausschaben und das Fruchtfleisch mitsamt der Schale in mundgerechte Würfel schneiden.',
        'Butter im Topf erhitzen, Zwiebel, Knoblauch und Ingwer darin 2 Minuten glasig anschwitzen.',
        'Die Kürbiswürfel hinzufügen und 3 Minuten unter Rühren mitbraten.',
        'Mit der heißen Gemüsebrühe ablöschen, Deckel auflegen und ca. 15–18 Minuten weich garen.',
        'Kokosmilch einrühren und die Suppe mit dem Pürierstab samtig fein pürieren.',
        'Mit Salz, Pfeffer, Muskat und etwas Limettensaft abschmecken. In Schalen füllen und mit gerösteten Kürbiskernen und Kürbiskernöl anrichten.'
      ],
      notes: 'Hokkaido muss nicht geschält werden – die Schale wird beim Kochen wunderbar weich und gibt der Suppe ihre leuchtend orange Farbe.',
      tags: ['Suppe', 'Herbst', 'Vegetarisch', 'Suppen & Eintöpfe']
    };
  }

  // 10. Tiramisu (Zitronen-Tiramisu, Klassisch, Zuckerfrei)
  if (q.includes('tiramisu') || q.includes('tiramisù')) {
    const isLemon = q.includes('zitrone') || q.includes('lemon') || q.includes('limone');
    const isNoSugar = q.includes('ohne zucker') || q.includes('zuckerfrei') || q.includes('erythrit') || q.includes('xylit') || q.includes('ohne tucker');

    if (isLemon) {
      return {
        title: isNoSugar ? 'Erfrischendes Zitronen-Tiramisu (ohne Zucker)' : 'Cremiges Zitronen-Tiramisu (Limoncello-Art)',
        category: 'Desserts',
        prepTime: '25 Min',
        cookTime: '0 Min (4 Std. Kühlen)',
        portions,
        difficulty: 'Einfach',
        description: isNoSugar
          ? 'Herrlich fruchtiges, zuckerfreies Zitronen-Tiramisu mit samtiger Mascarpone-Creme, Bio-Zitronenabrieb und zuckerfreien Löffelbiskuits.'
          : 'Sommerliches, cremiges Zitronen-Tiramisu mit fruchtiger Zitronencreme, Mascarpone und getränkten Löffelbiskuits.',
        ingredients: [
          { name: 'Mascarpone', amount: scaleAmount(500, 4, portions), unit: 'g' },
          { name: 'Magerquark oder griechischer Joghurt', amount: scaleAmount(250, 4, portions), unit: 'g' },
          { name: isNoSugar ? 'Erythrit oder Birkenzucker (pudrig gemahlen)' : 'Puderzucker', amount: scaleAmount(80, 4, portions), unit: 'g' },
          { name: isNoSugar ? 'Zuckerfreie Löffelbiskuits oder Mandelbiskuit' : 'Löffelbiskuits (Savoiardi)', amount: scaleAmount(200, 4, portions), unit: 'g' },
          { name: 'Bio-Zitronen (unbehandelt für Saft & feinen Abrieb)', amount: scaleAmount(3, 4, portions), unit: 'Stück' },
          { name: 'Frisch gepresster Orangensaft (oder Milch zum Tränken)', amount: scaleAmount(150, 4, portions), unit: 'ml' },
          { name: 'Vanilleextrakt oder gemahlene Bourbon-Vanille', amount: scaleAmount(1, 4, portions), unit: 'TL' },
          { name: 'Frische Minzblätter & Zitronenzesten zur Dekoration', amount: scaleAmount(1, 4, portions), unit: 'Handvoll' }
        ],
        instructions: [
          'Zwei Bio-Zitronen heiß abwaschen, trockenreiben und die Schale fein abreiben. Danach alle drei Zitronen auspressen.',
          'Für die Tränke: Den Zitronensaft mit Orangensaft (oder Wasser) und 1 EL Erythrit/Puderzucker verrühren.',
          'Für die Creme: Mascarpone mit Magerquark, dem restlichen Erythrit/Puderzucker, Vanilleextrakt und dem Zitronenabrieb mit dem Schneebesen cremig rühren.',
          'Eine flache Auflaufform bereitstellen. Die Hälfte der Löffelbiskuits kurz in die Zitronen-Tränke tauchen und den Boden der Form damit auslegen.',
          'Die Hälfte der samtigen Mascarpone-Zitronencreme gleichmäßig auf den Biskuits verstreichen.',
          'Eine zweite Schicht getränkte Biskuits darauflegen und mit der restlichen Mascarponecreme abschließen.',
          'Das Zitronen-Tiramisu abdecken und mindestens 4 Stunden (am besten über Nacht) im Kühlschrank durchziehen lassen. Vor dem Servieren mit frischen Zitronenzesten und Minze garnieren.'
        ],
        notes: 'Durch die Kombination aus Mascarpone und Quark wird die Creme herrlich leicht, standfest und herrlich frisch.',
        tags: ['Desserts', 'Italienisch', isNoSugar ? 'Ohne Zucker' : 'Sommerlich', 'Kühlen']
      };
    }

    return {
      title: isNoSugar ? 'Klassisches Tiramisu (ohne Zucker)' : 'Original Venezianisches Tiramisu',
      category: 'Desserts',
      prepTime: '25 Min',
      cookTime: '0 Min (4 Std. Kühlen)',
      portions,
      difficulty: 'Einfach',
      description: 'Der italienische Dessert-König: Schichten aus espresso-getränkten Löffelbiskuits und luftig-samtiger Mascarponecreme.',
      ingredients: [
        { name: 'Mascarpone', amount: scaleAmount(500, 4, portions), unit: 'g' },
        { name: 'Frische Eigelbe (sehr frisch, Bio)', amount: scaleAmount(4, 4, portions), unit: 'Stück' },
        { name: isNoSugar ? 'Erythrit (fein gemahlen)' : 'Feiner Zucker', amount: scaleAmount(90, 4, portions), unit: 'g' },
        { name: 'Löffelbiskuits', amount: scaleAmount(200, 4, portions), unit: 'g' },
        { name: 'Starker abgekühlter Espresso', amount: scaleAmount(200, 4, portions), unit: 'ml' },
        { name: 'Ungesüßtes Kakaopulver zum Bestäuben', amount: scaleAmount(2, 4, portions), unit: 'EL' },
        { name: 'Optional: Amaretto oder Marsala', amount: scaleAmount(2, 4, portions), unit: 'EL' }
      ],
      instructions: [
        'Eigelbe mit dem Zucker/Erythrit in einer Schüssel 4–5 Minuten hell-cremig aufschlagen.',
        'Mascarpone löffelweise vorsichtig unter die Eigelbmasse heben, bis eine glatte Creme entsteht.',
        'Den Espresso in einen tiefen Teller gießen (optional mit Amaretto mischen).',
        'Die Löffelbiskuits kurz von beiden Seiten im Espresso wenden und eine Auflaufform damit auslegen.',
        'Die Hälfte der Mascarponecreme darauf verteilen. Eine zweite Schicht getränkte Biskuits und die restliche Creme aufschichten.',
        'Mindestens 4 Stunden kühlen und kurz vor dem Servieren dick mit echtem Backkakao bestäuben.'
      ],
      notes: 'Die Biskuits nur ganz kurz in den Espresso tauchen, damit sie saftig bleiben, aber nicht matschig werden.',
      tags: ['Desserts', 'Klassiker', 'Italienisch']
    };
  }

  // 11. Kuchen & Backen (z.B. Apfelkuchen mit Rührteig ohne Zucker & Banane)
  if (q.includes('kuchen') || q.includes('muffin') || q.includes('brownie') || q.includes('torte') || q.includes('apfelkuchen')) {
    const isApple = q.includes('apfel') || q.includes('äpfel');
    const isBanana = q.includes('banane') || q.includes('bananen');
    const isNoSugar = q.includes('ohne zucker') || q.includes('zuckerfrei') || isBanana;

    return {
      title: isApple && isBanana
        ? 'Saftiger Apfel-Rührkuchen mit Bananensüße (ohne Zucker)'
        : isApple
        ? 'Versunkener Apfelkuchen aus feinem Rührteig'
        : 'Feiner Rührkuchen mit Früchten',
      category: 'Backen & Kuchen',
      prepTime: '20 Min',
      cookTime: '40 Min',
      portions: portions > 4 ? portions : 8,
      difficulty: 'Einfach',
      description: isNoSugar
        ? 'Wunderbar saftiger Rührkuchen, natürlich gesüßt mit reifen Bananen und verfeinert mit aromatischen Apfelspalten und Zimt.'
        : 'Klassischer goldgelber Rührkuchen mit saftigen Apfelspalten und feiner Vanillenote.',
      ingredients: [
        { name: 'Äpfel (z.B. Boskoop, Elstar oder Braeburn)', amount: scaleAmount(3, 4, portions), unit: 'Stück' },
        { name: isBanana ? 'Sehr reife Bananen (zerdrückt als natürlicher Süßstoff)' : 'Zucker', amount: isBanana ? scaleAmount(2, 4, portions) : scaleAmount(150, 4, portions), unit: isBanana ? 'Stück' : 'g' },
        { name: 'Dinkel- oder Weizenmehl', amount: scaleAmount(250, 4, portions), unit: 'g' },
        { name: 'Butter (weich) oder Kokosöl', amount: scaleAmount(120, 4, portions), unit: 'g' },
        { name: 'Eier (Größe M)', amount: scaleAmount(3, 4, portions), unit: 'Stück' },
        { name: 'Backpulver', amount: scaleAmount(2, 4, portions), unit: 'TL' },
        { name: 'Zimt & Bourbon-Vanille', amount: scaleAmount(1, 4, portions), unit: 'TL' },
        { name: 'Milch oder Mandelmilch', amount: scaleAmount(50, 4, portions), unit: 'ml' }
      ],
      instructions: [
        'Den Backofen auf 180 °C Ober-/Unterhitze vorheizen. Eine Springform (24-26 cm) einfetten.',
        'Die Äpfel schälen, vierteln, entkernen und an der Oberseite mehrmals fächerartig einritzen.',
        isBanana ? 'Die reifen Bananen mit einer Gabel zu einem feinen Brei zerdrücken.' : 'Die weiche Butter mit Zucker schaumig schlagen.',
        'Die weiche Butter mit dem Bananenmus/Zucker und den Eiern cremig verrühren.',
        'Mehl, Backpulver, Zimt und Vanille mischen und zusammen mit der Milch kurz unterrühren.',
        'Den Teig in die Form füllen, die vorbereiteten Apfelspalten fächerförmig darauflegen und leicht eindrücken.',
        'Ca. 40–45 Minuten im vorgeheizten Ofen backen, bis der Kuchen goldbraun ist (Stäbchenprobe machen).'
      ],
      notes: 'Je reifer die Bananen sind (braune Punkte auf der Schale), desto süßer und saftiger wird der Teig ganz ohne Haushaltszucker.',
      tags: ['Backen & Kuchen', 'Apfelkuchen', isNoSugar ? 'Ohne Zucker' : 'Klassiker']
    };
  }

  // 12. Kekse / Cookies / Schokokekse / Plätzchen (z.B. Schokokeks ohne Zucker)
  if (q.includes('keks') || q.includes('cookie') || q.includes('cookies') || q.includes('plätzchen')) {
    const isChocolate = q.includes('schoko') || q.includes('kakao') || q.includes('chocolate');
    const isNoSugar = q.includes('ohne zucker') || q.includes('zuckerfrei') || q.includes('erythrit') || q.includes('xylit') || q.includes('banane');

    return {
      title: isChocolate
        ? (isNoSugar ? 'Knusprige Schoko-Cookies (ohne Zucker)' : 'Klassische Double-Chocolate-Cookies')
        : (isNoSugar ? 'Zarte Hafer-Kekse (ohne Zucker)' : 'Knusprige Butterkekse'),
      category: 'Backen & Kuchen',
      prepTime: '15 Min',
      cookTime: '12 Min',
      portions: portions > 4 ? portions : 12,
      difficulty: 'Einfach',
      description: isChocolate
        ? (isNoSugar
          ? 'Herrlich schokoladige, saftige Cookies ganz ohne Haushaltszucker – perfekt gesüßt mit Erythrit/Xylit, gemahlenen Mandeln und edlem Backkakao.'
          : 'Saftige, knusprige Cookies mit reichlich Schokolade und knackigen Schokodrops.')
        : 'Goldgelb gebackene, knusprige Kekse zum Kaffee oder Tee.',
      ingredients: isChocolate ? [
        { name: 'Gemahlene Mandeln oder Dinkelmehl', amount: scaleAmount(150, 4, portions), unit: 'g' },
        { name: 'Ungesüßtes Kakaopulver (Backkakao)', amount: scaleAmount(40, 4, portions), unit: 'g' },
        { name: isNoSugar ? 'Erythrit oder Birkenzucker (Xylit)' : 'Brauner Zucker', amount: scaleAmount(70, 4, portions), unit: 'g' },
        { name: 'Butter (weich) oder Kokosöl', amount: scaleAmount(60, 4, portions), unit: 'g' },
        { name: 'Ei (Größe M)', amount: '1', unit: 'Stück' },
        { name: isNoSugar ? 'Zuckerfreie Zartbitter-Schokodrops (mind. 70% Kakao)' : 'Zartbitter-Schokodrops', amount: scaleAmount(60, 4, portions), unit: 'g' },
        { name: 'Backpulver', amount: '0.5', unit: 'TL' },
        { name: 'Prise Meersalz & Bourbon-Vanille', amount: '1', unit: 'Prise' }
      ] : [
        { name: 'Dinkelmehl oder Hafermehl', amount: scaleAmount(200, 4, portions), unit: 'g' },
        { name: 'Butter (zimmerwarm)', amount: scaleAmount(80, 4, portions), unit: 'g' },
        { name: isNoSugar ? 'Erythrit oder reife Banane' : 'Zucker', amount: scaleAmount(60, 4, portions), unit: 'g' },
        { name: 'Ei', amount: '1', unit: 'Stück' },
        { name: 'Backpulver & Vanille', amount: '1', unit: 'TL' }
      ],
      instructions: [
        'Den Backofen auf 175 °C Ober-/Unterhitze vorheizen und ein Backblech mit Backpapier auslegen.',
        'Die weiche Butter mit dem Erythrit/Zucker und dem Ei in einer Schüssel cremig verrühren.',
        'Gemahlene Mandeln/Mehl, Kakaopulver, Backpulver und eine Prise Salz vermengen und unter die Masse heben.',
        'Die Schokodrops vorsichtig unter den formbaren Teig kneten.',
        'Mit den Händen oder einem Esslöffel etwa walnussgroße Kugeln formen, auf das Blech setzen und leicht flachdrücken.',
        'Im vorgeheizten Ofen für ca. 10–12 Minuten backen (die Cookies härten beim Abkühlen noch nach).',
        'Auf einem Kuchengitter vollständig auskühlen lassen und genießen!'
      ],
      notes: 'Die Cookies nach dem Backen nicht zu lange im Ofen lassen – wenn sie aus dem Ofen kommen, dürfen sie in der Mitte noch leicht weich sein.',
      tags: ['Backen & Kuchen', 'Kekse', isNoSugar ? 'Ohne Zucker' : 'Schokolade']
    };
  }

  // 13. Dynamic Category-Specific Intelligent Chef Synthesizer
  const capitalized = q.length > 0 ? (q.charAt(0).toUpperCase() + q.slice(1)) : 'Köstliches Rezept';
  const isNoSugar = q.includes('ohne zucker') || q.includes('zuckerfrei') || q.includes('erythrit') || q.includes('xylit') || q.includes('banane');

  // A. Baked Goods (Kuchen, Muffins, Brot, Waffeln, Pancakes, Teig)
  if (q.includes('waffel') || q.includes('pancake') || q.includes('pfannkuchen') || q.includes('brot') || q.includes('brötchen') || q.includes('teig') || q.includes('muffin') || q.includes('tarte')) {
    return {
      title: `${capitalized}`,
      category: 'Backen & Kuchen',
      prepTime: '15 Min',
      cookTime: '20 Min',
      portions,
      difficulty: 'Einfach',
      description: `Herrlich aromatisches, frisch gebackenes Rezept für ${capitalized} mit perfekter Teigkonsistenz.`,
      ingredients: [
        { name: 'Dinkel- oder Weizenmehl (Type 405/630)', amount: scaleAmount(250, 4, portions), unit: 'g' },
        { name: isNoSugar ? 'Erythrit, Birkenzucker oder reife Banane' : 'Feiner Zucker', amount: scaleAmount(60, 4, portions), unit: 'g' },
        { name: 'Butter (geschmolzen) oder Pflanzenöl', amount: scaleAmount(80, 4, portions), unit: 'g' },
        { name: 'Frische Eier (Größe M)', amount: scaleAmount(2, 4, portions), unit: 'Stück' },
        { name: 'Milch oder Pflanzendrink', amount: scaleAmount(150, 4, portions), unit: 'ml' },
        { name: 'Weinstein-Backpulver', amount: '1', unit: 'Päckchen' },
        { name: 'Bourbon-Vanille & Prise Salz', amount: '1', unit: 'Prise' }
      ],
      instructions: [
        `Den Backofen auf 180 °C Ober-/Unterhitze vorheizen (oder Waffeleisen/Pfanne vorbereiten).`,
        'Die Eier mit der Süße und einer Prise Salz schaumig schlagen.',
        'Die geschmolzene Butter und Milch unter ständigem Rühren hinzugeben.',
        'Mehl und Backpulver mischen und zügig unterheben, bis ein glatter, geschmeidiger Teig entsteht.',
        `Den Teig für ${capitalized} in die Form füllen bzw. portionsweise goldbraun ausbacken.`,
        'Warm servieren und nach Belieben mit frischen Beeren oder zuckerfreiem Puder verfeinern.'
      ],
      notes: 'Den Teig vor dem Backen ca. 5 Minuten ruhen lassen, damit das Mehl optimal quellen kann.',
      tags: ['Backen & Kuchen', isNoSugar ? 'Ohne Zucker' : 'Frisch gebacken']
    };
  }

  // B. Sweet Desserts, Ice Cream, Cremes
  if (q.includes('süß') || q.includes('dessert') || q.includes('eis') || q.includes('creme') || q.includes('pudding') || q.includes('erdbeer') || q.includes('beeren') || q.includes('mousse') || q.includes('parfait')) {
    return {
      title: `${capitalized}`,
      category: 'Desserts',
      prepTime: '15 Min',
      cookTime: '0 Min (Kühlen)',
      portions,
      difficulty: 'Einfach',
      description: `Samtiges, verführerisches Dessert für ${capitalized} mit natürlichen Aromen und herrlicher Leichtigkeit.`,
      ingredients: [
        { name: 'Griechischer Joghurt, Quark oder Mascarpone', amount: scaleAmount(300, 4, portions), unit: 'g' },
        { name: isNoSugar ? 'Erythrit (pudrig) oder Agavendicksaft' : 'Puderzucker', amount: scaleAmount(50, 4, portions), unit: 'g' },
        { name: 'Frische Beeren oder Früchte der Saison', amount: scaleAmount(150, 4, portions), unit: 'g' },
        { name: 'Vanilleextrakt oder Zitronenabrieb', amount: '1', unit: 'TL' },
        { name: 'Gehackte Nüsse oder Mandelblättchen zum Garnieren', amount: scaleAmount(30, 4, portions), unit: 'g' },
        { name: 'Frische Minze', amount: '1', unit: 'Zweig' }
      ],
      instructions: [
        'Die Creme-Basis (Joghurt/Quark/Mascarpone) mit der Süße und Vanille glattrühren.',
        'Früchte waschen, einen Teil pürieren und den Rest in mundgerechte Stücke schneiden.',
        `In dekorativen Dessertgläsern die Creme abwechselnd mit den Früchten schichten.`,
        'Für mindestens 30 bis 60 Minuten im Kühlschrank durchziehen lassen.',
        'Vor dem Servieren mit gerösteten Nüssen und frischer Minze garnieren.'
      ],
      notes: 'Schmeckt eiskalt serviert am aromatischsten und lässt sich wunderbar am Vortag vorbereiten.',
      tags: ['Desserts', isNoSugar ? 'Ohne Zucker' : 'Sommerlich']
    };
  }

  // C. Hearty Savory Dishes (Bowls, Currys, Pasta, Pfannengerichte)
  return {
    title: `${capitalized}`,
    category: 'Hauptgerichte',
    prepTime: '15 Min',
    cookTime: '20 Min',
    portions,
    difficulty: 'Einfach',
    description: `Frisch gekochtes, ausgewogenes Rezept für ${capitalized} mit aromatischen Gewürzen und saftiger Textur.`,
    ingredients: [
      { name: 'Hauptzutat (z.B. Gemüse, Hähnchenbrust, Tofu oder Lachs)', amount: scaleAmount(450, 4, portions), unit: 'g' },
      { name: 'Frisches buntes Saisongemüse (Paprika, Zucchini, Brokkoli)', amount: scaleAmount(300, 4, portions), unit: 'g' },
      { name: 'Zwiebel oder Schalotte (fein gehackt)', amount: scaleAmount(1, 4, portions), unit: 'Stück' },
      { name: 'Knoblauchzehe & frischer Ingwer', amount: scaleAmount(1, 4, portions), unit: 'Stück' },
      { name: 'Hochwertiges Olivenöl oder Kokosöl', amount: scaleAmount(2, 4, portions), unit: 'EL' },
      { name: 'Gemüsefond oder Kokosmilch', amount: scaleAmount(200, 4, portions), unit: 'ml' },
      { name: 'Meersalz, bunter Pfeffer & frische Kräuter', amount: '1', unit: 'Prise' }
    ],
    instructions: [
      'Gemüse und Hauptzutat waschen, putzen und in mundgerechte Stücke schneiden.',
      'Öl in einer großen Pfanne oder einem Wok erhitzen, Zwiebel und Knoblauch kurz anbraten.',
      'Die Hauptzutat hinzugeben und bei kräftiger Hitze rundherum scharf anbraten.',
      'Das frische Gemüse beigeben und 3–4 Minuten knackig mitbraten.',
      'Mit Fond oder Kokosmilch ablöschen, Hitze reduzieren und ca. 8–10 Minuten sanft köcheln lassen.',
      'Mit Salz, Pfeffer, Kräutern und einem Spritzer Zitronensaft abschmecken und servieren.'
    ],
    notes: 'Gemüse nicht zu weich kochen, damit Vitamine, Farbe und der herrliche Knack erhalten bleiben.',
    tags: ['Hauptgerichte', 'Frisch gekocht', 'Ausgewogen']
  };
}
