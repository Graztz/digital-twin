# Human 2.0: Digital Twin Interface

Dieses Projekt ist ein interaktives **Video-Mock-up-Interface**, das für das Modul „Human Augmentation“ entwickelt wurde. Es dient als Prototyp für eine kognitive Entscheidungsunterstützung in einer onkologischen Arztpraxis.

## Projektübersicht

Das Interface simuliert einen „In-Silico-Zwilling“ (IST), der Daten aus verschiedenen Quellen – wie MRT-Bildgebung, Laborwerten und Echtzeit-Biometrie – zusammenführt. Es dient als visuelle Grundlage für ein 2-5-minütiges Video, das den wissenschaftlichen Fortschritt und die Auswirkungen der Human Augmentation auf das tägliche Leben veranschaulicht.

## Features

* **Interaktives 3D-Modell:** Nutzt `three.js` und `react-three-fiber` zur Visualisierung eines digitalen Zwillings (via `.obj`-Datei).
* **Echtzeit-Diagnostik:** Live-Simulation von Vitaldaten und Laborparametern mit automatischer Normwert-Validierung basierend auf klinischen Standards.
* **Szenario-Steuerung (Presets):** Über ein Konfigurationsmenü können verschiedene medizinische Szenarien (Anämie, Diabetes, Infektion) live geladen werden.
* **Regie-Tools:** Enthält eine integrierte "Crash-Simulation", um die Abhängigkeit von KI-Systemen im medizinischen Kontext zu demonstrieren.

## Technische Umsetzung

* **Framework:** React mit Vite.
* **3D-Engine:** `@react-three/fiber` zur Integration des digitalen Zwillings.
* **Daten-Visualisierung:** `chart.js` für EKG- und Prognose-Graphen.
* **Styling:** Custom CSS mit Fokus auf ein futuristisches "Cyberpunk"-Interface-Design.

## Mitwirkende & Entwicklung

Dieses Interface wurde im Rahmen des Kurses „Human Augmentation“ (Gruppe 11) entwickelt.

* **Entwicklung:** Die Erstellung und Programmierung des Interfaces erfolgte unter Nutzung von **Gemini** als KI-Collaborator, um die komplexe Integration von 3D-Modellen, Echtzeit-Charts und der spezifischen Applikationslogik effizient umzusetzen.

---

### Installation

1. `npm install`
2. Lege deine `human.obj` Datei in den `public`-Ordner bzw. wähle ein Model aus dem Ordner aus.
3. `npm run dev` starten.
