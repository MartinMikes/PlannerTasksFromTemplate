# Microsoft Form Definition

## Campanula - koncertní úkoly z šablony

Tento formulář slouží jako vstupní bod pro vytvoření sady nových úkolů pro organizaci koncertu.

Formulář je funkční specifikací pro
Flow `CampanulaCreateConcertPlanFromTemplate`, který je součástí solution
`CampanulaPlannerFlows`. Produkční zdroj pro CI/CD je
`src\CampanulaPlannerFlows`.

Zde jsou ukázkové či doporučené vstupní hodnoty:

- Název koncertu: Postní (Jarní/Podzimní/Vánoční) koncert 2026
- Typ šablony: volba jednoho z nabízených typů
  - Velký — vhodný pro koncert s orchestrem a sólisty, typicky Vánoční, výjimečně i Podzimní (Mozart: Korunovační mše 2026), Malý se hodí typicky pro Postní/Jarní a často i pro Podzimní. Součástí této šablony je i tisk a předprodej vstupenek.
  - Malý — typicky pro Postní nebo Jarní koncert a většinou i pro Podzimní. Zde neřešíme vstupenky - Vstupné dobrovolné.
- Místo konání: Ignác/Jakub/Gotika/Kříž/Jinde

Další info v dokumentu <https://campanulajihlava.sharepoint.com/Sdilene%20dokumenty/N%C3%A1vody/Organizace%20koncert%C5%AF%20Campanuly.docx>

## Form questions

### Název koncertu

Bude v Planneru použito pro pojmenování konkrétního plánu, aby se nám tam nemíchaly úkoly pro různé koncerty. Do názvu plánu se později automaticky doplní do závorek i místo konání definované níže.

### Typ šablony

Výběr jedné z hodnot: Velký, Malý

Každá šablona obsahuje větší či menší množství úkolů, Velký je vhodný pro koncert s orchestrem a sólisty (typicky Vánoční, výjimečně i Podzimní), Malý se hodí typicky pro Postní/Jarní a často i pro Podzimní

### Místo konání

Výběr jedné z hodnot: Ignác, Jakub, Kříž, Gotika, Jinde

Volbou konkrétního místa vyfiltrujeme v šabloně konkrétní úkoly vztahující se k danému místu. Navíc se Místo v závorkách použije i pro název plánu v Planneru.

Ve Flow se tato hodnota používá jako druhá filtrovací hodnota pro stejný
sloupec `tbTasksTemplate[TemplateType]` jako `Typ šablony`. Výsledný Planner plán
tedy obsahuje řádky, kde `TemplateType` odpovídá zvolenému typu koncertu
(`Velký` nebo `Malý`), a zároveň řádky, kde `TemplateType` odpovídá zvolenému
místu (`Ignác`, `Jakub`, `Kříž`, `Gotika` nebo `Jinde`).

### Datum koncertu

Pokud datum ještě není přesně stanoveno (např. z důvodu ověření dostupnosti koncertního místa, či hosta), pak zde použijeme nejdřívější uvažovanou variantu, aby nám neutekly nějaké termíny úkolů.

Datum musí být kalendářně později než dnešní datum v časové zóně `Europe/Prague`. Koncert ve stejný den Flow odmítne před vytvořením Planner plánu.
