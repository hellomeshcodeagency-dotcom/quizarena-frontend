import { useEffect, useState, useRef } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { getSocket } from '../services/socket'
import useAuthStore from '../context/authStore'

const TIMER_BY_DIFF = { easy: 25, medium: 15, hard: 8 }

const PRACTICE_QUESTIONS = {
  easy: {
    Sports: [
      { question: "What is Nigeria's national football team nickname?", options: { a: "Golden Lions", b: "Super Eagles", c: "Green Panthers", d: "Flying Stars" }, correct: 'b' },
      { question: "How many players are on a football team?", options: { a: "9", b: "10", c: "11", d: "12" }, correct: 'c' },
      { question: "Nigeria won Olympic football gold in which year?", options: { a: "1992", b: "1996", c: "2000", d: "2004" }, correct: 'b' },
      { question: "How many times has Nigeria won AFCON?", options: { a: "1", b: "2", c: "3", d: "4" }, correct: 'c' },
      { question: "Which Nigerian footballer is nicknamed Jay-Jay?", options: { a: "Nwankwo Kanu", b: "Jay-Jay Okocha", c: "Rashidi Yekini", d: "Sunday Oliseh" }, correct: 'b' },
      { question: "What sport is played at Wimbledon?", options: { a: "Football", b: "Cricket", c: "Tennis", d: "Rugby" }, correct: 'c' },
      { question: "How many goals in a hat-trick?", options: { a: "2", b: "3", c: "4", d: "5" }, correct: 'b' },
      { question: "Which country hosts the Tour de France?", options: { a: "Italy", b: "Spain", c: "Germany", d: "France" }, correct: 'd' },
      { question: "How many rings are on the Olympic flag?", options: { a: "4", b: "5", c: "6", d: "7" }, correct: 'b' },
      { question: "In which sport do you use a shuttlecock?", options: { a: "Tennis", b: "Squash", c: "Badminton", d: "Ping-pong" }, correct: 'c' },
    ],
    Science: [
      { question: "What is the chemical symbol for water?", options: { a: "WA", b: "H2O", c: "HO2", d: "W" }, correct: 'b' },
      { question: "What planet is closest to the Sun?", options: { a: "Venus", b: "Earth", c: "Mercury", d: "Mars" }, correct: 'c' },
      { question: "What do plants need to make food?", options: { a: "Moonlight", b: "Sunlight", c: "Starlight", d: "Firelight" }, correct: 'b' },
      { question: "How many legs does a spider have?", options: { a: "6", b: "8", c: "10", d: "12" }, correct: 'b' },
      { question: "What is the largest planet in our solar system?", options: { a: "Saturn", b: "Uranus", c: "Neptune", d: "Jupiter" }, correct: 'd' },
      { question: "What gas do humans breathe in?", options: { a: "Carbon dioxide", b: "Nitrogen", c: "Oxygen", d: "Hydrogen" }, correct: 'c' },
      { question: "What is the boiling point of water in Celsius?", options: { a: "50°C", b: "75°C", c: "100°C", d: "150°C" }, correct: 'c' },
      { question: "How many bones are in the adult human body?", options: { a: "156", b: "186", c: "206", d: "226" }, correct: 'c' },
      { question: "What is the powerhouse of the cell?", options: { a: "Nucleus", b: "Ribosome", c: "Mitochondria", d: "Chloroplast" }, correct: 'c' },
      { question: "Which planet is known as the Red Planet?", options: { a: "Venus", b: "Jupiter", c: "Saturn", d: "Mars" }, correct: 'd' },
    ],
    Geography: [
      { question: "What is the capital of Nigeria?", options: { a: "Lagos", b: "Kano", c: "Ibadan", d: "Abuja" }, correct: 'd' },
      { question: "What is the largest continent?", options: { a: "Africa", b: "Asia", c: "Europe", d: "America" }, correct: 'b' },
      { question: "What ocean is the largest?", options: { a: "Atlantic", b: "Indian", c: "Arctic", d: "Pacific" }, correct: 'd' },
      { question: "How many states does Nigeria have?", options: { a: "30", b: "34", c: "36", d: "40" }, correct: 'c' },
      { question: "What is the capital of France?", options: { a: "Berlin", b: "Madrid", c: "Rome", d: "Paris" }, correct: 'd' },
      { question: "What is the longest river in the world?", options: { a: "Amazon", b: "Congo", c: "Nile", d: "Niger" }, correct: 'c' },
      { question: "What is the smallest continent?", options: { a: "Europe", b: "Australia", c: "Antarctica", d: "South America" }, correct: 'b' },
      { question: "Which country is the largest in the world by area?", options: { a: "USA", b: "China", c: "Canada", d: "Russia" }, correct: 'd' },
      { question: "What is the capital of the UK?", options: { a: "Manchester", b: "Edinburgh", c: "London", d: "Dublin" }, correct: 'c' },
      { question: "Which country has the most people?", options: { a: "USA", b: "India", c: "China", d: "Russia" }, correct: 'c' },
    ],
    Nollywood: [
      { question: "Which actress is known as Mama G?", options: { a: "Genevieve Nnaji", b: "Rita Dominic", c: "Patience Ozokwo", d: "Omotola Jalade" }, correct: 'c' },
      { question: "Nollywood is primarily based in which city?", options: { a: "Abuja", b: "Port Harcourt", c: "Enugu", d: "Lagos" }, correct: 'd' },
      { question: "What does RMD stand for?", options: { a: "Ramsey Moussa Dominic", b: "Richard Mofe-Damijo", c: "Robert Musa David", d: "Raymond Mathew Douglas" }, correct: 'b' },
      { question: "Genevieve Nnaji is a famous Nigerian what?", options: { a: "Singer", b: "Actress", c: "Dancer", d: "Comedian" }, correct: 'b' },
      { question: "Which film launched modern Nollywood?", options: { a: "Glamour Girls", b: "Living in Bondage", c: "Emotional Crack", d: "True Confession" }, correct: 'b' },
      { question: "Omotola Jalade is also known as?", options: { a: "Omosexy", b: "Omo Naija", c: "Tola the Great", d: "Nigerian Queen" }, correct: 'a' },
      { question: "In what decade did Nollywood become famous globally?", options: { a: "1980s", b: "1990s", c: "2000s", d: "2010s" }, correct: 'b' },
      { question: "Nollywood is the world's __ largest film industry?", options: { a: "First", b: "Second", c: "Third", d: "Fourth" }, correct: 'b' },
      { question: "Which Nigerian actor is known as Pete Edochie?", options: { a: "A comedian", b: "A veteran actor", c: "A musician", d: "A director" }, correct: 'b' },
      { question: "Mercy Johnson is known for what?", options: { a: "Singing", b: "Comedy acting", c: "Drama acting", d: "Dancing" }, correct: 'c' },
    ],
    Technology: [
      { question: "What does CPU stand for?", options: { a: "Central Processing Unit", b: "Computer Processing Unit", c: "Central Program Utility", d: "Core Processing Unit" }, correct: 'a' },
      { question: "Which company made the iPhone?", options: { a: "Samsung", b: "Google", c: "Apple", d: "Microsoft" }, correct: 'c' },
      { question: "What does WWW stand for?", options: { a: "World Wide Web", b: "World Wide Wire", c: "Wide World Web", d: "Wide World Wire" }, correct: 'a' },
      { question: "What does AI stand for?", options: { a: "Automated Intelligence", b: "Artificial Intelligence", c: "Automated Interface", d: "Artificial Interface" }, correct: 'b' },
      { question: "What is the most popular social media platform?", options: { a: "Twitter", b: "Instagram", c: "Facebook", d: "TikTok" }, correct: 'c' },
      { question: "What does USB stand for?", options: { a: "Universal System Bus", b: "Universal Serial Bus", c: "United Serial Bus", d: "Universal Serial Base" }, correct: 'b' },
      { question: "What is Google primarily known as?", options: { a: "A browser", b: "A search engine", c: "An email service", d: "A social network" }, correct: 'b' },
      { question: "What does HTML stand for?", options: { a: "Hyper Text Markup Language", b: "High Text Machine Language", c: "Hyper Transfer Markup Language", d: "High Transfer Machine Logic" }, correct: 'a' },
      { question: "Which Nigerian payment company was acquired by Stripe?", options: { a: "Flutterwave", b: "Interswitch", c: "Paystack", d: "Quickteller" }, correct: 'c' },
      { question: "What does GPS stand for?", options: { a: "Global Positioning System", b: "Global Position Satellite", c: "General Position System", d: "Global Phone System" }, correct: 'a' },
    ],
    'General Knowledge': [
      { question: "How many days are in a week?", options: { a: "5", b: "6", c: "7", d: "8" }, correct: 'c' },
      { question: "What colour is the sky on a clear day?", options: { a: "Green", b: "Blue", c: "Yellow", d: "Red" }, correct: 'b' },
      { question: "How many months are in a year?", options: { a: "10", b: "11", c: "12", d: "13" }, correct: 'c' },
      { question: "Who wrote Things Fall Apart?", options: { a: "Wole Soyinka", b: "Chinua Achebe", c: "Chimamanda Adichie", d: "Ben Okri" }, correct: 'b' },
      { question: "How many sides does a triangle have?", options: { a: "2", b: "3", c: "4", d: "5" }, correct: 'b' },
      { question: "What is the capital of the USA?", options: { a: "New York", b: "Los Angeles", c: "Chicago", d: "Washington DC" }, correct: 'd' },
      { question: "How many continents are on Earth?", options: { a: "5", b: "6", c: "7", d: "8" }, correct: 'c' },
      { question: "What is 10 x 10?", options: { a: "20", b: "100", c: "1000", d: "10" }, correct: 'b' },
      { question: "What is the chemical formula for water?", options: { a: "HO", b: "H2O", c: "H3O", d: "OH2" }, correct: 'b' },
      { question: "How many hours are in a day?", options: { a: "12", b: "20", c: "24", d: "36" }, correct: 'c' },
    ],
  },
  medium: {
    Sports: [
      { question: "Who scored Nigeria's first World Cup goal in 1994?", options: { a: "Rashidi Yekini", b: "Jay-Jay Okocha", c: "Emmanuel Amuneke", d: "Daniel Amokachi" }, correct: 'a' },
      { question: "Which Nigerian club won the CAF Champions League 2003 and 2004?", options: { a: "Rangers", b: "Shooting Stars", c: "Enyimba FC", d: "Heartland" }, correct: 'c' },
      { question: "The Moshood Abiola Stadium is in which city?", options: { a: "Lagos", b: "Kano", c: "Abuja", d: "Port Harcourt" }, correct: 'c' },
      { question: "Victor Osimhen joined which club after Napoli?", options: { a: "Chelsea", b: "Arsenal", c: "Galatasaray", d: "PSG" }, correct: 'c' },
      { question: "Nigeria first qualified for the World Cup in which year?", options: { a: "1990", b: "1994", c: "1998", d: "2002" }, correct: 'b' },
      { question: "Which Nigerian player was part of Arsenal's Invincibles?", options: { a: "Jay-Jay Okocha", b: "Nwankwo Kanu", c: "Sunday Oliseh", d: "Daniel Amokachi" }, correct: 'b' },
      { question: "How many players are on a basketball team on the court?", options: { a: "4", b: "5", c: "6", d: "7" }, correct: 'b' },
      { question: "In which sport is a 'birdie' a score term?", options: { a: "Tennis", b: "Cricket", c: "Golf", d: "Baseball" }, correct: 'c' },
      { question: "Which country has won the most FIFA World Cups?", options: { a: "Germany", b: "Argentina", c: "Italy", d: "Brazil" }, correct: 'd' },
      { question: "Which Nigerian footballer wore the number 10 jersey most famously?", options: { a: "Rashidi Yekini", b: "Jay-Jay Okocha", c: "Nwankwo Kanu", d: "Celestine Babayaro" }, correct: 'b' },
    ],
    Science: [
      { question: "What is the atomic number of Carbon?", options: { a: "4", b: "6", c: "8", d: "12" }, correct: 'b' },
      { question: "Who discovered Penicillin?", options: { a: "Louis Pasteur", b: "Alexander Fleming", c: "Marie Curie", d: "Isaac Newton" }, correct: 'b' },
      { question: "What is the hardest natural substance on Earth?", options: { a: "Gold", b: "Iron", c: "Diamond", d: "Titanium" }, correct: 'c' },
      { question: "How many chromosomes does a human cell have?", options: { a: "23", b: "44", c: "46", d: "48" }, correct: 'c' },
      { question: "What is the speed of light approximately?", options: { a: "200,000 km/s", b: "300,000 km/s", c: "400,000 km/s", d: "500,000 km/s" }, correct: 'b' },
      { question: "What is the chemical symbol for Gold?", options: { a: "Go", b: "Gd", c: "Au", d: "Ag" }, correct: 'c' },
      { question: "What gas do plants absorb during photosynthesis?", options: { a: "Oxygen", b: "Nitrogen", c: "Carbon Dioxide", d: "Hydrogen" }, correct: 'c' },
      { question: "What is the unit of electric current?", options: { a: "Volt", b: "Watt", c: "Ohm", d: "Ampere" }, correct: 'd' },
      { question: "Which organ produces insulin?", options: { a: "Liver", b: "Kidney", c: "Pancreas", d: "Stomach" }, correct: 'c' },
      { question: "What is the most abundant gas in Earth's atmosphere?", options: { a: "Oxygen", b: "Carbon Dioxide", c: "Nitrogen", d: "Argon" }, correct: 'c' },
    ],
    Geography: [
      { question: "Which is the largest country in Africa by area?", options: { a: "Nigeria", b: "Sudan", c: "Algeria", d: "DRC" }, correct: 'c' },
      { question: "Which river is longest in Africa?", options: { a: "Congo", b: "Nile", c: "Niger", d: "Zambezi" }, correct: 'b' },
      { question: "Mount Kilimanjaro is in which country?", options: { a: "Kenya", b: "Ethiopia", c: "Tanzania", d: "Uganda" }, correct: 'c' },
      { question: "Currency of South Africa?", options: { a: "Shilling", b: "Rand", c: "Cedi", d: "Franc" }, correct: 'b' },
      { question: "Amazon rainforest is primarily in which country?", options: { a: "Colombia", b: "Venezuela", c: "Peru", d: "Brazil" }, correct: 'd' },
      { question: "Which African city has the largest population?", options: { a: "Nairobi", b: "Cairo", c: "Lagos", d: "Kinshasa" }, correct: 'c' },
      { question: "Which country is known as the Land of the Rising Sun?", options: { a: "China", b: "Korea", c: "Japan", d: "Thailand" }, correct: 'c' },
      { question: "What is the currency of the UK?", options: { a: "Euro", b: "Dollar", c: "Pound Sterling", d: "Franc" }, correct: 'c' },
      { question: "The Sahara Desert is in which continent?", options: { a: "Asia", b: "Australia", c: "South America", d: "Africa" }, correct: 'd' },
      { question: "Which country has the most official languages?", options: { a: "India", b: "South Africa", c: "Switzerland", d: "Canada" }, correct: 'b' },
    ],
    Nollywood: [
      { question: "Which Nigerian film was submitted for the Oscars 2020?", options: { a: "Wedding Party", b: "King of Boys", c: "Lionheart", d: "October 1" }, correct: 'c' },
      { question: "Who directed Lionheart?", options: { a: "Kemi Adetiba", b: "Genevieve Nnaji", c: "Kunle Afolayan", d: "EbonyLife Films" }, correct: 'b' },
      { question: "Living in Bondage was released in which year?", options: { a: "1989", b: "1990", c: "1992", d: "1995" }, correct: 'c' },
      { question: "Which actress starred in the film Oloture?", options: { a: "Genevieve Nnaji", b: "Sharon Ooja", c: "Omotola Jalade", d: "Mercy Johnson" }, correct: 'b' },
      { question: "Which director made King of Boys?", options: { a: "Kemi Adetiba", b: "Kunle Afolayan", c: "Mnet", d: "EbonyLife Films" }, correct: 'a' },
      { question: "Funke Akindele is known for which comedy film series?", options: { a: "Omo Ghetto", b: "Jenifa's Diary", c: "A Trip to Jamaica", d: "Citation" }, correct: 'b' },
      { question: "Which Nigerian film broke box office records in 2016?", options: { a: "30 Days in Atlanta", b: "Chief Daddy", c: "The Wedding Party", d: "Sugar Rush" }, correct: 'c' },
      { question: "Nollywood produces roughly how many films per year?", options: { a: "500", b: "1,000", c: "2,000", d: "3,000" }, correct: 'c' },
      { question: "Which actor played Scar in the Nigerian remake of Lion King spoof?", options: { a: "Ramsey Nouah", b: "Jim Iyke", c: "Desmond Elliot", d: "OC Ukeje" }, correct: 'b' },
      { question: "EbonyLife was founded by?", options: { a: "Joke Silva", b: "Mo Abudu", c: "Ini Edo", d: "Kate Henshaw" }, correct: 'b' },
    ],
    Technology: [
      { question: "What does API stand for?", options: { a: "Application Programming Interface", b: "Automated Process Integration", c: "Application Process Interaction", d: "Automated Programming Interface" }, correct: 'a' },
      { question: "Which Nigerian payment company was founded by Shola Akinlade?", options: { a: "Flutterwave", b: "Paystack", c: "Interswitch", d: "Kuda" }, correct: 'b' },
      { question: "What does URL stand for?", options: { a: "Uniform Resource Locator", b: "Universal Resource Link", c: "Unified Remote Locator", d: "Universal Response Locator" }, correct: 'a' },
      { question: "What programming language is primarily used for web styling?", options: { a: "JavaScript", b: "Python", c: "CSS", d: "HTML" }, correct: 'c' },
      { question: "What year was Facebook founded?", options: { a: "2002", b: "2004", c: "2006", d: "2008" }, correct: 'b' },
      { question: "What does RAM stand for?", options: { a: "Random Access Memory", b: "Read Access Memory", c: "Random Application Memory", d: "Read Application Memory" }, correct: 'a' },
      { question: "Which company owns YouTube?", options: { a: "Apple", b: "Meta", c: "Amazon", d: "Google" }, correct: 'd' },
      { question: "What does SQL stand for?", options: { a: "Structured Query Language", b: "Standard Query Language", c: "Simple Query Language", d: "Structured Question Language" }, correct: 'a' },
      { question: "What is the first commercial internet in Nigeria launched year?", options: { a: "1992", b: "1994", c: "1996", d: "1998" }, correct: 'c' },
      { question: "Bitcoin was created by?", options: { a: "Elon Musk", b: "Satoshi Nakamoto", c: "Vitalik Buterin", d: "Mark Zuckerberg" }, correct: 'b' },
    ],
    'General Knowledge': [
      { question: "Who painted the Mona Lisa?", options: { a: "Michelangelo", b: "Raphael", c: "Leonardo da Vinci", d: "Caravaggio" }, correct: 'c' },
      { question: "First iPhone launched in which year?", options: { a: "2005", b: "2006", c: "2007", d: "2008" }, correct: 'c' },
      { question: "Square root of 144?", options: { a: "11", b: "12", c: "13", d: "14" }, correct: 'b' },
      { question: "Which planet is known for its rings?", options: { a: "Jupiter", b: "Uranus", c: "Saturn", d: "Neptune" }, correct: 'c' },
      { question: "Who wrote Romeo and Juliet?", options: { a: "Charles Dickens", b: "William Shakespeare", c: "Jane Austen", d: "Mark Twain" }, correct: 'b' },
      { question: "What is the currency of Japan?", options: { a: "Yuan", b: "Won", c: "Yen", d: "Ringgit" }, correct: 'c' },
      { question: "How many sides does a hexagon have?", options: { a: "5", b: "6", c: "7", d: "8" }, correct: 'b' },
      { question: "What year did World War 2 end?", options: { a: "1943", b: "1944", c: "1945", d: "1946" }, correct: 'c' },
      { question: "What is the capital of Australia?", options: { a: "Sydney", b: "Melbourne", c: "Brisbane", d: "Canberra" }, correct: 'd' },
      { question: "Which element has the symbol Fe?", options: { a: "Fluorine", b: "Iron", c: "Francium", d: "Fermium" }, correct: 'b' },
    ],
  },
  hard: {
    Sports: [
      { question: "Which year did Enyimba win their first CAF Champions League?", options: { a: "2001", b: "2002", c: "2003", d: "2004" }, correct: 'c' },
      { question: "Nigeria's all-time top scorer at the World Cup is?", options: { a: "Jay-Jay Okocha", b: "Rashidi Yekini", c: "Nwankwo Kanu", d: "Emmanuel Amuneke" }, correct: 'b' },
      { question: "Who was Nigeria's captain at the 1994 World Cup?", options: { a: "Nwankwo Kanu", b: "Stephen Keshi", c: "Sunday Oliseh", d: "Augustine Eguavoen" }, correct: 'b' },
      { question: "How many goals did Rashidi Yekini score for Nigeria internationally?", options: { a: "37", b: "44", c: "51", d: "58" }, correct: 'd' },
      { question: "Which Nigerian won the best African player award in 1993?", options: { a: "Nwankwo Kanu", b: "Stephen Keshi", c: "Rashidi Yekini", d: "Sunday Oliseh" }, correct: 'c' },
      { question: "What is the exact distance of a marathon race?", options: { a: "40km", b: "41.5km", c: "42.195km", d: "43km" }, correct: 'c' },
      { question: "In cricket, what is the maximum number of runs from a single ball?", options: { a: "4", b: "5", c: "6", d: "7" }, correct: 'c' },
      { question: "Who holds the record for most Olympic gold medals?", options: { a: "Usain Bolt", b: "Carl Lewis", c: "Michael Phelps", d: "Mark Spitz" }, correct: 'c' },
      { question: "What is the circumference of a standard football?", options: { a: "58–60cm", b: "62–64cm", c: "68–70cm", d: "72–74cm" }, correct: 'c' },
      { question: "Nigeria's first World Cup match was against?", options: { a: "Argentina", b: "Greece", c: "Bulgaria", d: "Italy" }, correct: 'c' },
    ],
    Science: [
      { question: "What is the half-life of Carbon-14?", options: { a: "3,730 years", b: "5,730 years", c: "7,730 years", d: "9,730 years" }, correct: 'b' },
      { question: "What is the pH of pure water?", options: { a: "6", b: "7", c: "8", d: "9" }, correct: 'b' },
      { question: "Which particle has no charge?", options: { a: "Proton", b: "Electron", c: "Neutron", d: "Positron" }, correct: 'c' },
      { question: "What is the Avogadro number?", options: { a: "6.022 × 10²²", b: "6.022 × 10²³", c: "6.022 × 10²⁴", d: "6.022 × 10²⁵" }, correct: 'b' },
      { question: "Which blood type is the universal donor?", options: { a: "A-", b: "B-", c: "AB-", d: "O-" }, correct: 'd' },
      { question: "What is the melting point of iron?", options: { a: "1,038°C", b: "1,238°C", c: "1,438°C", d: "1,538°C" }, correct: 'd' },
      { question: "DNA replication happens in which phase of the cell cycle?", options: { a: "G1", b: "S phase", c: "G2", d: "M phase" }, correct: 'b' },
      { question: "What is the name of the force that holds the nucleus together?", options: { a: "Electromagnetic", b: "Gravitational", c: "Strong nuclear force", d: "Weak nuclear force" }, correct: 'c' },
      { question: "Absolute zero is how many degrees Celsius?", options: { a: "-173.15°C", b: "-223.15°C", c: "-273.15°C", d: "-323.15°C" }, correct: 'c' },
      { question: "What percentage of the human body is water?", options: { a: "45–50%", b: "55–60%", c: "65–70%", d: "75–80%" }, correct: 'b' },
    ],
    Geography: [
      { question: "What is the deepest lake in the world?", options: { a: "Lake Superior", b: "Lake Victoria", c: "Lake Baikal", d: "Caspian Sea" }, correct: 'c' },
      { question: "Which country has the most time zones?", options: { a: "USA", b: "Russia", c: "China", d: "France" }, correct: 'd' },
      { question: "What is the smallest country in the world?", options: { a: "Monaco", b: "Liechtenstein", c: "Vatican City", d: "San Marino" }, correct: 'c' },
      { question: "Which African country has the most pyramids?", options: { a: "Egypt", b: "Libya", c: "Sudan", d: "Ethiopia" }, correct: 'c' },
      { question: "What is the capital of Kazakhstan?", options: { a: "Almaty", b: "Astana", c: "Shymkent", d: "Nur-Sultan" }, correct: 'd' },
      { question: "The Strait of Malacca separates which two landmasses?", options: { a: "Malaysia and Indonesia", b: "India and Sri Lanka", c: "Japan and Korea", d: "Philippines and Borneo" }, correct: 'a' },
      { question: "What percentage of Africa's land is desert?", options: { a: "20%", b: "30%", c: "40%", d: "50%" }, correct: 'c' },
      { question: "The longest national highway in Nigeria is?", options: { a: "A1 Lagos-Ibadan", b: "A2 Lagos-Benin", c: "A1 Lagos-Kano", d: "A3 Abuja-Kaduna" }, correct: 'c' },
      { question: "Which Nigerian state has the largest landmass?", options: { a: "Borno", b: "Niger", c: "Taraba", d: "Kebbi" }, correct: 'a' },
      { question: "What is the elevation of Mount Everest?", options: { a: "8,549m", b: "8,649m", c: "8,749m", d: "8,849m" }, correct: 'd' },
    ],
    Nollywood: [
      { question: "What year was the first Nollywood film released?", options: { a: "1989", b: "1990", c: "1992", d: "1993" }, correct: 'c' },
      { question: "Which Nigerian actor appeared in Hollywood's Beast of No Nation?", options: { a: "Ramsey Nouah", b: "Olu Jacobs", c: "Abraham Attah", d: "Richard Mofe-Damijo" }, correct: 'c' },
      { question: "Kunle Afolayan directed which acclaimed film?", options: { a: "Lionheart", b: "The Figurine", c: "Oloture", d: "Citation" }, correct: 'b' },
      { question: "Which Nigerian film was Netflix's first original African content?", options: { a: "Oloture", b: "Lionheart", c: "Blood Sisters", d: "Shanty Town" }, correct: 'b' },
      { question: "In which year did Nollywood surpass Hollywood in output?", options: { a: "2002", b: "2004", c: "2006", d: "2009" }, correct: 'd' },
      { question: "Who produced the 2022 Netflix series Blood Sisters?", options: { a: "Mo Abudu", b: "Kemi Adetiba", c: "Biyi Bandele", d: "EbonyLife Studios" }, correct: 'd' },
      { question: "What was the production budget of The Wedding Party?", options: { a: "₦30 million", b: "₦50 million", c: "₦100 million", d: "₦150 million" }, correct: 'c' },
      { question: "Ramsey Nouah starred in which iconic Nollywood series?", options: { a: "Tinsel", b: "Super Story", c: "Living in Bondage sequel", d: "Sons of the Caliphate" }, correct: 'c' },
      { question: "Which year did Omotola Jalade win TIME 100 most influential?", options: { a: "2011", b: "2012", c: "2013", d: "2014" }, correct: 'c' },
      { question: "Pete Edochie is best known for playing which character?", options: { a: "Okonkwo in Things Fall Apart", b: "Saro-Wiwa in a biopic", c: "The Chief in Glamour Girls", d: "Papa Ajasco in a comedy" }, correct: 'a' },
    ],
    Technology: [
      { question: "What is the time complexity of binary search?", options: { a: "O(n)", b: "O(log n)", c: "O(n²)", d: "O(1)" }, correct: 'b' },
      { question: "What year was the first version of Linux released?", options: { a: "1989", b: "1991", c: "1993", d: "1995" }, correct: 'b' },
      { question: "IPv6 addresses are how many bits long?", options: { a: "64 bits", b: "96 bits", c: "128 bits", d: "256 bits" }, correct: 'c' },
      { question: "Which sorting algorithm has the best average-case time complexity?", options: { a: "Bubble sort", b: "Insertion sort", c: "Quick sort", d: "Selection sort" }, correct: 'c' },
      { question: "What does HTTPS stand for?", options: { a: "Hyper Text Transfer Protocol Secure", b: "High Text Transfer Protocol Secure", c: "Hyper Transfer Text Protocol Secure", d: "High Transfer Text Protocol Secure" }, correct: 'a' },
      { question: "Flutterwave was founded in which year?", options: { a: "2014", b: "2015", c: "2016", d: "2017" }, correct: 'c' },
      { question: "What is the default port for HTTPS?", options: { a: "80", b: "443", c: "8080", d: "3000" }, correct: 'b' },
      { question: "Which data structure uses LIFO order?", options: { a: "Queue", b: "Linked list", c: "Stack", d: "Tree" }, correct: 'c' },
      { question: "What does JWT stand for?", options: { a: "Java Web Token", b: "JSON Web Token", c: "JavaScript Web Transfer", d: "JSON Web Transfer" }, correct: 'b' },
      { question: "What is the maximum value of an 8-bit unsigned integer?", options: { a: "127", b: "255", c: "512", d: "1024" }, correct: 'b' },
    ],
    'General Knowledge': [
      { question: "In what year was the United Nations founded?", options: { a: "1943", b: "1945", c: "1947", d: "1949" }, correct: 'b' },
      { question: "What is the Fibonacci sequence starting value after 1, 1?", options: { a: "2", b: "3", c: "4", d: "5" }, correct: 'a' },
      { question: "Which empire was the largest in history by land area?", options: { a: "Roman Empire", b: "British Empire", c: "Mongol Empire", d: "Ottoman Empire" }, correct: 'b' },
      { question: "Who was the first human in space?", options: { a: "Neil Armstrong", b: "Buzz Aldrin", c: "Yuri Gagarin", d: "Alan Shepard" }, correct: 'c' },
      { question: "What is the speed of sound in air at sea level?", options: { a: "243 m/s", b: "343 m/s", c: "443 m/s", d: "543 m/s" }, correct: 'b' },
      { question: "Which country invented paper?", options: { a: "Egypt", b: "Greece", c: "China", d: "India" }, correct: 'c' },
      { question: "What is the half-life of Uranium-238?", options: { a: "2.5 billion years", b: "4.5 billion years", c: "6.5 billion years", d: "8.5 billion years" }, correct: 'b' },
      { question: "The Pythagorean theorem states that a² + b² equals?", options: { a: "a + b", b: "ab", c: "c²", d: "2ab" }, correct: 'c' },
      { question: "In which year did Nigeria gain independence?", options: { a: "1958", b: "1960", c: "1962", d: "1964" }, correct: 'b' },
      { question: "What is the atomic number of Uranium?", options: { a: "88", b: "90", c: "92", d: "94" }, correct: 'c' },
    ],
  }
}

const DIFF_CONFIG = {
  easy:   { label: 'Easy',   color: 'var(--teal)',   time: 25, desc: '25s per question · beginner' },
  medium: { label: 'Medium', color: 'var(--gold)',   time: 15, desc: '15s per question · standard' },
  hard:   { label: 'Hard',   color: 'var(--red)',    time: 8,  desc: '8s per question · expert'   },
}

const shuffle = arr => [...arr].sort(() => Math.random() - 0.5)

export default function Game() {
  const { roomId }  = useParams()
  const location    = useLocation()
  const navigate    = useNavigate()
  const user        = useAuthStore(s => s.user)
  const timerRef    = useRef(null)
  const practiceRef = useRef([])

  const stateInfo  = location.state || {}
  const isPractice = stateInfo.isPractice || roomId?.startsWith('practice-')

  const [difficulty,  setDifficulty]  = useState(null) // null = not chosen yet
  const [phase,       setPhase]       = useState(isPractice ? 'select-difficulty' : 'waiting')
  const [question,    setQuestion]    = useState(null)
  const [qIndex,      setQIndex]      = useState(0)
  const [qTotal,      setQTotal]      = useState(10)
  const [timeLeft,    setTimeLeft]    = useState(15)
  const [answered,    setAnswered]    = useState(false)
  const [selected,    setSelected]    = useState(null)
  const [correctAns,  setCorrectAns]  = useState(null)
  const [score,       setScore]       = useState(0)
  const [correct,     setCorrect]     = useState(0)
  const [opponents,   setOpponents]   = useState([])

  // ── START PRACTICE ─────────────────────────────────────
  const startPractice = (diff) => {
    setDifficulty(diff)
    const timerMax = DIFF_CONFIG[diff].time
    const cat  = stateInfo.category || 'General Knowledge'
    const bank = PRACTICE_QUESTIONS[diff][cat] || PRACTICE_QUESTIONS[diff]['General Knowledge']
    const questions = shuffle(bank).slice(0, 10)
    practiceRef.current = questions
    setPhase('playing')
    loadPracticeQ(questions, 0, timerMax)
  }

  const loadPracticeQ = (questions, index, timerMax) => {
    if (index >= questions.length) { setPhase('ended'); return }
    const q = questions[index]
    setQuestion({ question: q.question, options: q.options })
    setQIndex(index)
    setQTotal(questions.length)
    setAnswered(false)
    setSelected(null)
    setCorrectAns(null)
    setTimeLeft(timerMax)
    clearInterval(timerRef.current)
    let t = timerMax
    timerRef.current = setInterval(() => {
      t--
      setTimeLeft(t)
      if (t <= 0) {
        clearInterval(timerRef.current)
        setCorrectAns(questions[index].correct)
        setAnswered(true)
        setTimeout(() => loadPracticeQ(questions, index + 1, timerMax), 1500)
      }
    }, 1000)
  }

  const pickPracticeAnswer = (letter) => {
    if (answered) return
    const q = practiceRef.current[qIndex]
    const timerMax = DIFF_CONFIG[difficulty].time
    clearInterval(timerRef.current)
    const isCorrect = letter === q.correct
    setSelected(letter)
    setCorrectAns(q.correct)
    setAnswered(true)
    if (isCorrect) {
      const pts = Math.max(100, timeLeft * 85)
      setScore(s => s + pts)
      setCorrect(c => c + 1)
    }
    setTimeout(() => loadPracticeQ(practiceRef.current, qIndex + 1, timerMax), 1400)
  }

  // ── MULTIPLAYER SOCKET ──────────────────────────────────
  useEffect(() => {
    if (isPractice) return
    const socket = getSocket()
    if (!socket) { navigate('/lobby'); return }

    socket.emit('join_room', { roomId })

    socket.on('player_joined', ({ players }) => {
      setOpponents(players.filter(p => p.userId !== user?.id))
    })
    socket.on('game_starting', ({ countdown: c }) => {
      setPhase('countdown')
      let tick = c
      const iv = setInterval(() => {
        tick--
        if (tick <= 0) { clearInterval(iv); setPhase('playing') }
      }, 1000)
    })
    socket.on('question', (q) => {
      setQuestion(q); setQIndex(q.index); setQTotal(q.total)
      setAnswered(false); setSelected(null); setCorrectAns(null)
      setTimeLeft(q.timeLimit || 15)
      clearInterval(timerRef.current)
      let t = q.timeLimit || 15
      timerRef.current = setInterval(() => { t--; setTimeLeft(t); if(t<=0) clearInterval(timerRef.current) }, 1000)
    })
    socket.on('answer_result', ({ isCorrect, correctAnswer, totalScore }) => {
      setCorrectAns(correctAnswer); setScore(totalScore)
      if (isCorrect) setCorrect(c => c + 1)
    })
    socket.on('question_ended', ({ correctAnswer }) => { setCorrectAns(correctAnswer); clearInterval(timerRef.current) })
    socket.on('score_update', ({ userId, score: s }) => {
      if (userId !== user?.id) setOpponents(prev => prev.map(p => p.userId === userId ? { ...p, score: s } : p))
    })
    socket.on('game_ended', (data) => {
      clearInterval(timerRef.current)
      navigate('/results', { state: { result: data, stakeNaira: stateInfo.stakeNaira } })
    })
    socket.on('error', () => navigate('/lobby'))

    return () => {
      clearInterval(timerRef.current)
      socket.off('player_joined'); socket.off('game_starting'); socket.off('question')
      socket.off('answer_result'); socket.off('question_ended'); socket.off('score_update')
      socket.off('game_ended'); socket.off('error')
    }
  }, [roomId, isPractice])

  const pickAnswer = (letter) => {
    if (answered || !question) return
    setAnswered(true); setSelected(letter)
    clearInterval(timerRef.current)
    const responseTimeMs = ((DIFF_CONFIG[difficulty]?.time || 15) - timeLeft) * 1000
    getSocket()?.emit('submit_answer', { roomId, questionIndex: qIndex, answer: letter, responseTimeMs })
  }

  const timerMax   = DIFF_CONFIG[difficulty]?.time || 15
  const timerPct   = timeLeft / timerMax
  const circ       = 251
  const strokeOff  = circ - (circ * timerPct)
  const diffColor  = DIFF_CONFIG[difficulty]?.color || 'var(--indigo)'
  const timerColor = timeLeft > timerMax * 0.4 ? 'var(--indigo)' : timeLeft > timerMax * 0.2 ? 'var(--gold)' : 'var(--red)'

  const getAnswerStyle = (letter) => {
    const base = { display:'flex', alignItems:'center', gap:14, padding:'15px 16px', width:'100%', borderRadius:'var(--r)', cursor: answered ? 'default' : 'pointer', transition:'all 0.2s', border:'1px solid', fontFamily:'var(--body)', fontSize:14, fontWeight:500, color:'var(--text)' }
    if (correctAns) {
      if (letter === correctAns) return { ...base, background:'var(--teal-dim)', borderColor:'var(--teal)', boxShadow:'0 0 16px var(--teal-mid)', animation:'bounce 0.5s ease' }
      if (letter === selected && letter !== correctAns) return { ...base, background:'var(--red-dim)', borderColor:'var(--red)', animation:'shake 0.4s ease' }
      return { ...base, background:'var(--surface2)', borderColor:'var(--line)', opacity:0.5 }
    }
    if (selected === letter) return { ...base, background:'var(--indigo-dim)', borderColor:'var(--indigo)' }
    return { ...base, background:'var(--surface2)', borderColor:'var(--line2)' }
  }

  // ── DIFFICULTY SELECT ───────────────────────────────────
  if (phase === 'select-difficulty') {
    return (
      <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🧠</div>
        <div style={{ fontFamily:'var(--display)', fontSize:24, fontWeight:800, marginBottom:6, textAlign:'center' }}>Quiz Practice</div>
        <div style={{ fontSize:13, color:'var(--muted2)', marginBottom:32, textAlign:'center' }}>
          Category: <span style={{ color:'var(--text)', fontWeight:600 }}>{stateInfo.category || 'General Knowledge'}</span>
        </div>
        <div style={{ fontFamily:'var(--display)', fontSize:14, fontWeight:700, color:'var(--muted2)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:16 }}>
          Select difficulty
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:12, width:'100%', maxWidth:320 }}>
          {Object.entries(DIFF_CONFIG).map(([key, cfg]) => (
            <div
              key={key}
              onClick={() => startPractice(key)}
              style={{ background:'var(--surface)', border:`2px solid ${cfg.color}33`, borderRadius:14, padding:'18px 20px', cursor:'pointer', transition:'all 0.2s', display:'flex', alignItems:'center', gap:16 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = cfg.color; e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = `0 0 20px ${cfg.color}33` }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = `${cfg.color}33`; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={{ width:44, height:44, borderRadius:12, background:`${cfg.color}18`, border:`1px solid ${cfg.color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
                {key === 'easy' ? '😊' : key === 'medium' ? '🤔' : '🔥'}
              </div>
              <div>
                <div style={{ fontFamily:'var(--display)', fontSize:16, fontWeight:800, color:cfg.color, marginBottom:3 }}>{cfg.label}</div>
                <div style={{ fontSize:12, color:'var(--muted2)' }}>{cfg.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => navigate(-1)} style={{ marginTop:24, fontSize:13, color:'var(--muted2)', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--display)', fontWeight:600 }}>
          ← Back
        </button>
      </div>
    )
  }

  // ── PRACTICE ENDED ──────────────────────────────────────
  if (isPractice && phase === 'ended') {
    const acc = Math.round((correct / qTotal) * 100)
    const diffCfg = DIFF_CONFIG[difficulty]
    return (
      <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, textAlign:'center', background:'var(--bg)' }}>
        <div style={{ fontSize:64, marginBottom:16 }}>🎯</div>
        <div style={{ fontFamily:'var(--display)', fontSize:28, fontWeight:800, marginBottom:8 }}>Practice complete!</div>
        <div style={{ marginBottom:20 }}>
          <span style={{ background:`${diffCfg.color}18`, border:`1px solid ${diffCfg.color}44`, borderRadius:100, padding:'4px 14px', fontSize:12, fontFamily:'var(--display)', fontWeight:700, color:diffCfg.color }}>
            {diffCfg.label} difficulty
          </span>
        </div>
        <div style={{ background:'var(--surface)', border:'1px solid var(--line2)', borderRadius:14, padding:20, width:'100%', maxWidth:320, marginBottom:24 }}>
          {[
            { l:'Correct', v:`${correct} / ${qTotal}`, c:'var(--teal)' },
            { l:'Accuracy', v:`${acc}%`, c: acc>=70 ? 'var(--teal)' : acc>=40 ? 'var(--gold)' : 'var(--red)' },
            { l:'Score', v:`${score} pts`, c:'var(--gold)' },
            { l:'Category', v: stateInfo.category || 'General Knowledge' },
          ].map((row,i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom: i<3 ? '1px solid var(--line)' : 'none' }}>
              <span style={{ color:'var(--muted2)', fontSize:13 }}>{row.l}</span>
              <span style={{ fontFamily:'var(--mono)', fontWeight:700, color:row.c || 'var(--text)', fontSize:13 }}>{row.v}</span>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10, width:'100%', maxWidth:300 }}>
          <button onClick={() => { setScore(0); setCorrect(0); setPhase('select-difficulty') }} className="btn btn-primary btn-full btn-lg">
            Try again
          </button>
          <button onClick={() => navigate('/lobby')} className="btn btn-outline btn-full">
            Play for real money
          </button>
          <button onClick={() => navigate('/games')} className="btn btn-ghost btn-full">
            Back to games
          </button>
        </div>
      </div>
    )
  }

  // ── WAITING / COUNTDOWN ─────────────────────────────────
  if (phase === 'waiting') {
    return (
      <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
        <div className="spinner" style={{ width:40, height:40 }} />
        <div style={{ fontFamily:'var(--display)', fontSize:18, fontWeight:700 }}>Waiting for players...</div>
        <div style={{ fontSize:13, color:'var(--muted2)' }}>{stateInfo.category} · ₦{(stateInfo.stakeNaira||0).toLocaleString()} stake</div>
      </div>
    )
  }
  if (phase === 'countdown') {
    return (
      <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <div style={{ fontFamily:'var(--display)', fontSize:96, fontWeight:800, color:'var(--indigo)', animation:'popIn 0.4s ease' }}>Go!</div>
      </div>
    )
  }

  // ── PLAYING ─────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid var(--line2)', background:'var(--surface)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {isPractice
            ? <span style={{ background:`${diffColor}18`, border:`1px solid ${diffColor}44`, borderRadius:100, padding:'3px 10px', fontSize:11, fontFamily:'var(--display)', fontWeight:700, color:diffColor }}>
                {DIFF_CONFIG[difficulty]?.label || 'Practice'}
              </span>
            : <span className="tag tag-red"><span className="live-dot" /> Live</span>
          }
          <span style={{ fontSize:12, color:'var(--muted2)' }}>Q {qIndex+1} / {qTotal}</span>
        </div>
        <div style={{ fontFamily:'var(--mono)', fontSize:13, fontWeight:700, color:'var(--gold)' }}>
          {isPractice ? `${score} pts` : `₦${Math.round((stateInfo.stakeNaira||0)*2*0.9).toLocaleString()} prize`}
        </div>
      </div>

      <div style={{ height:3, background:'var(--line2)' }}>
        <div style={{ height:3, background:`linear-gradient(90deg, var(--indigo), var(--indigo-lt))`, width:`${(qIndex/qTotal)*100}%`, transition:'width 0.4s ease' }} />
      </div>

      <div style={{ display:'flex', justifyContent:'center', padding:'20px 0 12px' }}>
        <div style={{ position:'relative', width:88, height:88 }}>
          <svg viewBox="0 0 80 80" width="88" height="88" style={{ transform:'rotate(-90deg)' }}>
            <circle cx="40" cy="40" r="36" fill="none" stroke="var(--line2)" strokeWidth="4" />
            <circle cx="40" cy="40" r="36" fill="none" stroke={timerColor} strokeWidth="4" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={strokeOff} style={{ transition:'stroke-dashoffset 1s linear, stroke 0.3s', filter: timeLeft<=3 ? `drop-shadow(0 0 6px ${timerColor})` : 'none' }} />
          </svg>
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--mono)', fontSize:26, fontWeight:700, color:timerColor }}>
            {timeLeft}
          </div>
        </div>
      </div>

      {question && (
        <div style={{ padding:'0 20px 16px' }}>
          <div style={{ fontFamily:'var(--display)', fontSize:11, fontWeight:700, color:'var(--muted2)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>
            {stateInfo.category || 'Quiz'}
          </div>
          <div style={{ fontSize:16, fontWeight:500, lineHeight:1.6 }}>{question.question}</div>
        </div>
      )}

      {question && (
        <div style={{ padding:'0 20px', display:'flex', flexDirection:'column', gap:10, marginBottom:16 }}>
          {Object.entries(question.options).map(([letter, text]) => (
            <button key={letter} style={getAnswerStyle(letter)} onClick={() => isPractice ? pickPracticeAnswer(letter) : pickAnswer(letter)} disabled={answered}>
              <div style={{ width:28, height:28, borderRadius:6, background: correctAns===letter ? 'var(--teal)' : selected===letter&&!correctAns ? 'var(--indigo)' : 'var(--line2)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--mono)', fontSize:11, fontWeight:800, color: correctAns===letter||selected===letter ? '#fff' : 'var(--muted2)', flexShrink:0, transition:'all 0.2s' }}>
                {letter.toUpperCase()}
              </div>
              <span>{text}</span>
            </button>
          ))}
        </div>
      )}

      {!isPractice && opponents.length > 0 && (
        <div style={{ display:'flex', gap:8, overflowX:'auto', padding:'0 20px 12px', scrollbarWidth:'none' }}>
          {opponents.map(opp => (
            <div key={opp.userId} style={{ flexShrink:0, background:'var(--surface)', border:'1px solid var(--line2)', borderRadius:100, padding:'4px 12px 4px 6px', display:'flex', alignItems:'center', gap:6, fontSize:12 }}>
              <div style={{ width:20, height:20, borderRadius:'50%', background:'var(--indigo-dim)', border:'1px solid var(--indigo-mid)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:800, color:'var(--indigo-lt)' }}>
                {opp.username?.substring(0,2).toUpperCase()}
              </div>
              <span style={{ color:'var(--text2)' }}>{opp.username}</span>
              <span style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--teal)' }}>{opp.score||0}pts</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
