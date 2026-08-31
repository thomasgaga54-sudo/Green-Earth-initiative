const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { User, Task, Reward } = require("./models/user.model");

const ADMIN_EMAIL = "admin@greenearth.com";
const ADMIN_PASSWORD = "GreenAdmin@2024";

/**
 * Auto-assign proofLevel based on task points:
 *   < 50 pts  → basic    (photo only)
 *   50–99 pts → enhanced (photo + detailed note required)
 *   100+ pts  → verified (photo + note + careful admin review)
 *
 * Quiz tasks always stay as "basic" (no photo needed, quiz engine handles verification).
 */
const proofLevel = (points, taskType = "photo") => {
  if (taskType === "quiz") return "basic";
  if (points >= 100) return "verified";
  if (points >= 50)  return "enhanced";
  return "basic";
};

const SEED_TASKS = [
  // ── Personal Healthy-Living Tasks ────────────────────────
  {
    title: "Walk Instead of Using a Vehicle",
    description: "Choose to walk instead of taking a car, bus, or motorbike for a short trip. Submit a photo of you on your walk or at your destination, and note where you walked to.",
    points: 30, category: "health",
    imageUrl: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&auto=format&fit=crop"
  },
  {
    title: "Walk 2,000 Steps",
    description: "Walk at least 2,000 steps in a single session. Use a phone pedometer, fitness tracker, or step counter app to track your steps. Submit a screenshot of your step count showing 2,000 or more.",
    points: 20, category: "health",
    imageUrl: "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=600&auto=format&fit=crop"
  },
  {
    title: "Walk 5,000 Steps",
    description: "Walk at least 5,000 steps in a single day. Use a phone pedometer, fitness tracker, or step counter app to track your steps. Submit a screenshot of your step count showing 5,000 or more.",
    points: 40, category: "health",
    imageUrl: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&auto=format&fit=crop"
  },
  {
    title: "Ride a Bicycle",
    description: "Ride a bicycle for a practical journey — to school, work, the shops, or a friend's house — where it is safe and appropriate. Submit a photo of you with your bike at your destination.",
    points: 40, category: "health",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop"
  },
  {
    title: "Spend 30 Minutes Outdoors",
    description: "Spend at least 30 continuous minutes outside — walking, gardening, sitting in a park, or doing any outdoor activity. Submit a photo of you enjoying the outdoors.",
    points: 20, category: "health",
    imageUrl: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&auto=format&fit=crop"
  },
  {
    title: "Drink Water Instead of a Sugary Drink",
    description: "Choose water over a sugary drink (soda, juice, energy drink) for an entire day. Submit a photo of you drinking water and note what sugary drink you replaced.",
    points: 15, category: "health",
    imageUrl: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&auto=format&fit=crop"
  },
  {
    title: "Keep Your Personal Area Clean",
    description: "Tidy and clean your personal space — your room, desk, locker, or any area that belongs to you. Submit a before and after photo showing the improvement.",
    points: 20, category: "health",
    imageUrl: "https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=600&auto=format&fit=crop"
  },

  // ── Educational Quiz Tasks ────────────────────────────────
  {
    title: "Climate Change Awareness Quiz",
    description: "Learn about climate change and test your knowledge. Answer 5 questions to earn points instantly — no photo needed!",
    points: 30, category: "education", taskType: "quiz", passMark: 3,
    imageUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&auto=format&fit=crop",
    quiz: [
      {
        question: "What is the main cause of climate change?",
        options: ["Volcanic eruptions", "Burning fossil fuels", "Ocean currents", "Deforestation alone"],
        correctIndex: 1
      },
      {
        question: "Which gas is the biggest contributor to the greenhouse effect?",
        options: ["Oxygen", "Nitrogen", "Carbon dioxide (CO₂)", "Hydrogen"],
        correctIndex: 2
      },
      {
        question: "What does the term 'global warming' refer to?",
        options: ["The Earth spinning faster", "The rise in Earth's average surface temperature", "More sunlight reaching Earth", "Warmer ocean tides"],
        correctIndex: 1
      },
      {
        question: "Which of these is a renewable energy source?",
        options: ["Coal", "Natural gas", "Solar power", "Petroleum"],
        correctIndex: 2
      },
      {
        question: "What is one effect of climate change on the oceans?",
        options: ["Oceans becoming saltier", "Sea levels rising", "Ocean temperatures falling", "More coral reefs growing"],
        correctIndex: 1
      }
    ]
  },
  {
    title: "Recycling Quiz",
    description: "How much do you know about recycling? Complete this quiz to earn points and learn something new!",
    points: 25, category: "education", taskType: "quiz", passMark: 3,
    imageUrl: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&auto=format&fit=crop",
    quiz: [
      {
        question: "Which of these items CAN typically be recycled?",
        options: ["Pizza boxes with grease", "Plastic water bottles", "Soiled paper towels", "Broken glass"],
        correctIndex: 1
      },
      {
        question: "What colour recycling bin is usually used for paper and cardboard in the UK?",
        options: ["Blue", "Green", "Red", "Yellow"],
        correctIndex: 0
      },
      {
        question: "Why is it important to rinse containers before recycling them?",
        options: ["To make them look cleaner", "To prevent contamination of other recyclables", "Rinsing is not necessary", "To reduce their weight"],
        correctIndex: 1
      },
      {
        question: "What does 'upcycling' mean?",
        options: ["Throwing items upward into a bin", "Turning waste into something of higher value", "Sending waste to another country", "Burning waste to create energy"],
        correctIndex: 1
      },
      {
        question: "Which of these materials takes the longest to decompose in landfill?",
        options: ["Paper", "Food scraps", "Plastic bottles", "Cotton clothing"],
        correctIndex: 2
      }
    ]
  },
  {
    title: "5 Ways to Save Water Quiz",
    description: "Learn five effective ways to save water and prove your knowledge. Every drop counts!",
    points: 25, category: "education", taskType: "quiz", passMark: 3,
    imageUrl: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&auto=format&fit=crop",
    quiz: [
      {
        question: "How much water can you save by turning off the tap while brushing your teeth?",
        options: ["1 litre per minute", "6 litres per minute", "20 litres per minute", "0.5 litres per minute"],
        correctIndex: 1
      },
      {
        question: "Which uses less water?",
        options: ["A 10-minute shower", "A full bath", "They use the same", "It depends on the shower head"],
        correctIndex: 0
      },
      {
        question: "What is grey water?",
        options: ["Water from the sea", "Dirty water from sinks and showers that can be reused for watering plants", "Rainwater stored in tanks", "Water that has been purified"],
        correctIndex: 1
      },
      {
        question: "When is the best time to water plants to reduce evaporation?",
        options: ["At midday in full sun", "Early morning or evening", "Any time is equally good", "Only when it is raining"],
        correctIndex: 1
      },
      {
        question: "Which of these is the best way to detect a hidden water leak?",
        options: ["Check your water bill for sudden increases", "Smell the water", "Look at the sky", "Call your neighbour"],
        correctIndex: 0
      }
    ]
  },
  {
    title: "Renewable Energy Quiz",
    description: "How much do you know about renewable energy? Complete this quiz to boost your eco knowledge and earn points!",
    points: 30, category: "education", taskType: "quiz", passMark: 3,
    imageUrl: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&auto=format&fit=crop",
    quiz: [
      {
        question: "Which of these is NOT a renewable energy source?",
        options: ["Wind power", "Solar power", "Natural gas", "Hydropower"],
        correctIndex: 2
      },
      {
        question: "What does a solar panel do?",
        options: ["Heats water using fire", "Converts sunlight into electricity", "Stores wind energy", "Filters rainwater"],
        correctIndex: 1
      },
      {
        question: "What is the main advantage of renewable energy over fossil fuels?",
        options: ["It is always cheaper", "It produces little to no greenhouse gas emissions", "It works better at night", "It requires less technology"],
        correctIndex: 1
      },
      {
        question: "Which country generates the most electricity from wind power?",
        options: ["USA", "France", "China", "Australia"],
        correctIndex: 2
      },
      {
        question: "What is biomass energy?",
        options: ["Energy from the sun", "Energy stored in living or recently living organic materials", "Energy from ocean waves", "Energy from magnets"],
        correctIndex: 1
      }
    ]
  },
  {
    title: "Environmental Safety Quiz",
    description: "Test your knowledge of environmental safety practices. Pass to earn points!",
    points: 25, category: "education", taskType: "quiz", passMark: 3,
    imageUrl: "https://images.unsplash.com/photo-1605792657660-596af9009e82?w=600&auto=format&fit=crop",
    quiz: [
      {
        question: "Why should you never pour used cooking oil down the drain?",
        options: ["It is too hot", "It blocks pipes and pollutes waterways", "It is illegal everywhere", "It smells bad"],
        correctIndex: 1
      },
      {
        question: "Where should old batteries be disposed of?",
        options: ["In the general waste bin", "Flushed down the toilet", "At a designated battery recycling point", "Buried in the garden"],
        correctIndex: 2
      },
      {
        question: "What hazard does open burning of rubbish create?",
        options: ["It attracts birds", "It releases toxic air pollutants and contributes to climate change", "It makes soil more fertile", "It only affects the person burning"],
        correctIndex: 1
      },
      {
        question: "What should you do if you see someone illegally dumping waste?",
        options: ["Ignore it", "Join them", "Report it to local authorities", "Take the waste home yourself"],
        correctIndex: 2
      },
      {
        question: "Why is it dangerous to drink water from a polluted river?",
        options: ["It tastes bad only", "It can contain harmful bacteria, chemicals, and parasites", "It is too cold", "It has no minerals"],
        correctIndex: 1
      }
    ]
  },
  {
    title: "Identify Recyclable Materials Quiz",
    description: "Can you tell what can and cannot be recycled? Test yourself and earn points!",
    points: 20, category: "education", taskType: "quiz", passMark: 3,
    imageUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600&auto=format&fit=crop",
    quiz: [
      {
        question: "Which of these is recyclable?",
        options: ["Used nappies/diapers", "Aluminium cans", "Broken crockery", "Wax-coated paper cups"],
        correctIndex: 1
      },
      {
        question: "Can you recycle a cardboard pizza box that has grease stains?",
        options: ["Yes, always", "No, grease contaminates the recycling process", "Only the lid", "Only if you wash it first"],
        correctIndex: 1
      },
      {
        question: "Which plastic recycling symbol means the item is widely recyclable?",
        options: ["No symbol needed", "A number inside a triangle of arrows", "A red cross", "A green heart"],
        correctIndex: 1
      },
      {
        question: "What should you do with a glass wine bottle before recycling it?",
        options: ["Break it into small pieces", "Rinse it and remove the lid", "Leave it as is with liquid inside", "Paint it"],
        correctIndex: 1
      },
      {
        question: "Which of these household items should NOT go in the regular recycling bin?",
        options: ["Cardboard boxes", "Steel food tins", "Old mobile phones", "Plastic milk bottles"],
        correctIndex: 2
      }
    ]
  },
  {
    title: "Tree Planting and Forests Quiz",
    description: "Learn about the importance of trees and forests for our planet. Answer 5 questions to earn points!",
    points: 25, category: "education", taskType: "quiz", passMark: 3,
    imageUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop",
    quiz: [
      {
        question: "How do trees help fight climate change?",
        options: ["By producing oxygen only", "By absorbing CO₂ from the atmosphere", "By blocking sunlight", "By cooling the soil underground"],
        correctIndex: 1
      },
      {
        question: "What is deforestation?",
        options: ["Planting new forests", "The large-scale removal of trees and forests", "A type of tree disease", "Harvesting fruit from trees"],
        correctIndex: 1
      },
      {
        question: "Which of these is a benefit of planting trees in cities?",
        options: ["They increase traffic", "They reduce urban heat, improve air quality and provide shade", "They block phone signals", "They increase flooding"],
        correctIndex: 1
      },
      {
        question: "Approximately how many trees are cut down globally every year?",
        options: ["1 million", "500 million", "15 billion", "100 billion"],
        correctIndex: 2
      },
      {
        question: "What is the best time of year to plant most trees in the UK?",
        options: ["Summer (July–August)", "Autumn to early spring (October–March)", "Only in spring", "Only in winter"],
        correctIndex: 1
      }
    ]
  },
  {
    title: "Climate Awareness Challenge",
    description: "A tougher climate challenge quiz. Show what you know about the environment — pass 4 out of 5 to earn bonus points!",
    points: 40, category: "education", taskType: "quiz", passMark: 4,
    imageUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&auto=format&fit=crop",
    quiz: [
      {
        question: "What is the Paris Agreement?",
        options: ["A trade deal between France and Germany", "An international treaty to limit global warming to below 2°C above pre-industrial levels", "A European recycling law", "A food sustainability policy"],
        correctIndex: 1
      },
      {
        question: "What percentage of the Earth's surface is covered by oceans?",
        options: ["50%", "61%", "71%", "85%"],
        correctIndex: 2
      },
      {
        question: "What is a carbon footprint?",
        options: ["A fossil preserved in rock", "The total greenhouse gas emissions caused by an individual, organisation, or product", "A type of renewable energy", "The area of land needed to grow food"],
        correctIndex: 1
      },
      {
        question: "Which sector produces the most global greenhouse gas emissions?",
        options: ["Agriculture", "Transport", "Energy (electricity and heat production)", "Buildings"],
        correctIndex: 2
      },
      {
        question: "What is the main purpose of the ozone layer?",
        options: ["To keep the Earth warm at night", "To protect Earth from harmful ultraviolet (UV) radiation from the sun", "To produce oxygen for humans", "To hold clouds in place"],
        correctIndex: 1
      }
    ]
  },

  // ── School Tasks ──────────────────────────────────────────
  {
    title: "Clean Your Classroom",
    description: "Help clean your classroom — sweep the floor, tidy desks, empty bins, and wipe surfaces. Submit a before and after photo of the classroom.",
    points: 40, category: "school",
    imageUrl: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&auto=format&fit=crop"
  },
  {
    title: "Pick Up Litter Around the School",
    description: "Walk around your school grounds and pick up any litter you find. Submit a photo of the litter collected and the cleaned area.",
    points: 50, category: "school",
    imageUrl: "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=600&auto=format&fit=crop"
  },
  {
    title: "Plant a School Tree",
    description: "With permission from your school, plant a tree in the school grounds. Submit a photo of you planting the tree and any permission given.",
    points: 100, category: "school",
    imageUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop"
  },
  {
    title: "Water School Plants",
    description: "Water the plants or garden areas around your school. Submit a photo of you watering the plants.",
    points: 20, category: "school",
    imageUrl: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=600&auto=format&fit=crop"
  },
  {
    title: "Create a Recycling Box for Your Class",
    description: "Make or set up a recycling box in your classroom for paper, plastic, or other recyclables. Submit a photo of the recycling box in place and being used.",
    points: 60, category: "school",
    imageUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600&auto=format&fit=crop"
  },
  {
    title: "Collect Recyclable Materials at School",
    description: "Collect recyclable materials — paper, bottles, cans — from around your school and sort them for recycling. Submit a photo of the materials collected.",
    points: 50, category: "school",
    imageUrl: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&auto=format&fit=crop"
  },
  {
    title: "Help Clean the School Compound",
    description: "Help clean and tidy the outdoor areas of your school — paths, playgrounds, gardens, or gates. Submit a before and after photo of the area.",
    points: 60, category: "school",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop"
  },
  {
    title: "Create an Environmental Poster",
    description: "Design and create a poster about an environmental issue — recycling, saving water, climate change, or reducing plastic. Display it in your school or community and submit a photo.",
    points: 50, category: "school",
    imageUrl: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&auto=format&fit=crop"
  },
  {
    title: "Give a Short Environmental Presentation",
    description: "Prepare and deliver a short presentation (at least 3 minutes) to your class or school about an environmental topic. Submit a photo of you presenting and a brief summary of what you covered.",
    points: 80, category: "school",
    imageUrl: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&auto=format&fit=crop"
  },
  {
    title: "Start an Environmental Club at School",
    description: "Take the initiative to start a school environmental club with at least 3 members. Submit a photo of the founding members and a written description of the club's goals.",
    points: 150, category: "school",
    imageUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&auto=format&fit=crop"
  },
  {
    title: "Participate in a School Cleanup",
    description: "Take part in an organised school cleanup event. Submit a photo of you participating and the waste collected during the cleanup.",
    points: 80, category: "school",
    imageUrl: "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=600&auto=format&fit=crop"
  },

  // ── Family Challenge Tasks ────────────────────────────────
  {
    title: "Help a Parent with Household Chores",
    description: "Spend time helping a parent or guardian with household chores — cleaning, cooking, tidying, or any other task they need help with. Submit a photo of you helping.",
    points: 50, category: "family",
    imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop"
  },
  {
    title: "Help a Younger Sibling Clean Their Room",
    description: "Help a younger sibling or child in the family clean and tidy their bedroom. Submit a before and after photo of the room.",
    points: 50, category: "family",
    imageUrl: "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=600&auto=format&fit=crop"
  },
  {
    title: "Cook or Help Prepare Food for the Family",
    description: "Cook a full meal or actively help prepare food for your family. Submit a photo of the meal you cooked or helped prepare.",
    points: 50, category: "family",
    imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&auto=format&fit=crop"
  },
  {
    title: "Help Someone Organise Their Belongings",
    description: "Help a family member sort and organise their belongings — wardrobe, shelf, storage area, or room. Submit a before and after photo.",
    points: 40, category: "family",
    imageUrl: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&auto=format&fit=crop"
  },
  {
    title: "Clean the Family Compound",
    description: "Work with your family to clean and tidy the compound or yard around your home. Submit a photo of the whole family taking part and the clean result.",
    points: 80, category: "family",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop"
  },
  {
    title: "Help an Elderly Family Member",
    description: "Spend time helping an elderly parent, grandparent, or relative with any tasks they need — chores, errands, cooking, or companionship. Submit a photo of you helping them.",
    points: 80, category: "family",
    imageUrl: "https://images.unsplash.com/photo-1516307365426-bea591f05011?w=600&auto=format&fit=crop"
  },
  {
    title: "Teach a Family Member an Environmental Habit",
    description: "Show a family member a new eco-friendly habit — recycling, saving water, turning off lights, composting, etc. Submit a photo of you teaching them and a short note about what you taught.",
    points: 60, category: "family",
    imageUrl: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&auto=format&fit=crop"
  },
  {
    title: "Family Plastic-Free Day Challenge",
    description: "As a family, go an entire day without using any single-use plastic. Document your plastic-free choices together and submit a photo of the whole family taking part.",
    points: 100, category: "family",
    imageUrl: "/uploads/plastic.jpg"
  },
  {
    title: "Plant a Family Tree",
    description: "Plant a tree together as a family in your garden, compound, or local green space. Submit a photo of the whole family planting or posing with the tree.",
    points: 120, category: "family",
    imageUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop"
  },
  {
    title: "Complete a Family Cleanup Challenge",
    description: "As a family, pick a dirty area — your street, local park, or community space — and clean it up together. Submit a before and after photo and a photo of the whole family taking part.",
    points: 150, category: "family",
    imageUrl: "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=600&auto=format&fit=crop"
  },

  // ── Community Tasks ───────────────────────────────────────
  {
    title: "Clean Your Street",
    description: "Clean the street outside your home — sweep, pick up litter, and tidy the area. Submit a before and after photo of your street.",
    points: 80, category: "community",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop"
  },
  {
    title: "Participate in a Community Cleanup",
    description: "Join an organised community cleanup event in your area. Submit a photo of you participating and the waste collected.",
    points: 100, category: "community",
    imageUrl: "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=600&auto=format&fit=crop"
  },
  {
    title: "Plant Trees in a Community Space",
    description: "With permission from the relevant authority, plant one or more trees in a public or community space. Submit a photo of the planted tree(s) and any permission obtained.",
    points: 150, category: "community",
    imageUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop"
  },
  {
    title: "Help Maintain a Community Garden",
    description: "Spend time helping to water, weed, or generally maintain a community garden. Submit a photo of you working in the garden.",
    points: 100, category: "community",
    imageUrl: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=600&auto=format&fit=crop"
  },
  {
    title: "Pick Up Litter in a Public Area",
    description: "Pick up litter in a park, beach, roadside, or other public area. Submit a photo of the litter collected and the cleaned area.",
    points: 80, category: "community",
    imageUrl: "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=600&auto=format&fit=crop"
  },
  {
    title: "Encourage Five People to Recycle",
    description: "Talk to at least five people — friends, family, or neighbours — and encourage them to recycle. Submit a photo or short written summary of who you spoke to and what you told them.",
    points: 100, category: "community",
    imageUrl: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&auto=format&fit=crop"
  },
  {
    title: "Teach Someone How to Separate Waste",
    description: "Show a family member, neighbour, or friend how to correctly separate recyclable waste from general waste. Submit a photo of you teaching them with the sorted waste visible.",
    points: 80, category: "community",
    imageUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600&auto=format&fit=crop"
  },
  {
    title: "Report an Overflowing Waste Bin",
    description: "Report an overflowing public waste bin to your local council or waste authority. Submit a photo of the overflowing bin and a screenshot or photo of your report.",
    points: 60, category: "community",
    imageUrl: "https://images.unsplash.com/photo-1604187351574-c75ca79f5807?w=600&auto=format&fit=crop"
  },
  {
    title: "Help Clean a School Environment",
    description: "Help clean the grounds, classrooms, or surroundings of a local school. Submit before and after photos of the area you cleaned.",
    points: 100, category: "community",
    imageUrl: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&auto=format&fit=crop"
  },
  {
    title: "Organise an Environmental Awareness Event",
    description: "Plan and run an event — a talk, workshop, stall, or school presentation — to raise environmental awareness in your community. Submit photos from the event and a brief description of what was covered.",
    points: 200, category: "community",
    imageUrl: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&auto=format&fit=crop"
  },
  {
    title: "Donate Usable Items Instead of Throwing Away",
    description: "Gather clothes, books, toys, or household items you no longer need and donate them to a charity, school, or community centre instead of throwing them away. Submit a photo of the items donated.",
    points: 80, category: "community",
    imageUrl: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=600&auto=format&fit=crop"
  },

  // ── Waste Management Tasks ────────────────────────────────
  {
    title: "Separate Plastic from Other Waste",
    description: "Sort your household waste and separate all plastic items into their own bag or bin. Submit a photo showing the separated plastic waste.",
    points: 30, category: "waste",
    imageUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600&auto=format&fit=crop"
  },
  {
    title: "Collect 10 Plastic Bottles",
    description: "Collect at least 10 plastic bottles from your home, street, or local area for recycling. Submit a photo of the 10+ bottles collected together.",
    points: 40, category: "waste",
    imageUrl: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&auto=format&fit=crop"
  },
  {
    title: "Collect 25 Plastic Bottles",
    description: "Collect at least 25 plastic bottles from your home, street, or community for recycling. Submit a photo of all 25+ bottles collected together.",
    points: 80, category: "waste",
    imageUrl: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop"
  },
  {
    title: "Recycle Old Paper",
    description: "Gather old newspapers, magazines, cardboard, or paper and take them to a recycling point or prepare them for collection. Submit a photo of the paper waste bundled up or at the recycling point.",
    points: 30, category: "waste",
    imageUrl: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&auto=format&fit=crop"
  },
  {
    title: "Reuse a Container",
    description: "Instead of throwing away an old container (bottle, jar, tin, box), find a practical way to reuse it. Submit a photo showing the container and how you reused it.",
    points: 20, category: "waste",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop"
  },
  {
    title: "Create Something Useful from Waste",
    description: "Use waste materials (plastic bottles, cardboard, old fabric, tins, etc.) to create something useful — a planter, storage box, toy, or decoration. Submit a photo of your finished creation.",
    points: 80, category: "waste",
    imageUrl: "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=600&auto=format&fit=crop"
  },
  {
    title: "Dispose of Batteries/E-Waste Properly",
    description: "Take old batteries, phones, cables, or other electronic waste to a proper disposal or recycling point instead of putting them in general waste. Submit a photo of the items and proof of correct disposal.",
    points: 60, category: "waste",
    imageUrl: "https://images.unsplash.com/photo-1605792657660-596af9009e82?w=600&auto=format&fit=crop"
  },
  {
    title: "Organise a Small Cleanup",
    description: "Organise and lead a small cleanup of your street, park, school, or community area with at least one other person. Submit before and after photos and a photo of the waste collected.",
    points: 100, category: "waste",
    imageUrl: "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=600&auto=format&fit=crop"
  },

  // ── Energy-Saving Tasks ───────────────────────────────────
  {
    title: "Turn Off Unnecessary Lights",
    description: "Go through your home and turn off all lights that are not needed. Submit a photo showing lights switched off in at least two rooms.",
    points: 10, category: "energy",
    imageUrl: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&auto=format&fit=crop"
  },
  {
    title: "Unplug Unused Appliances",
    description: "Unplug all appliances that are not in use — chargers, TVs on standby, microwaves, etc. Submit a photo showing unplugged appliances.",
    points: 15, category: "energy",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop"
  },
  {
    title: "Turn Off TV When Not Being Used",
    description: "Turn off the TV completely (not standby) when no one is watching. Submit a photo of the TV switched off at the plug or wall.",
    points: 10, category: "energy",
    imageUrl: "https://images.unsplash.com/photo-1593359677879-a4bb92f4df81?w=600&auto=format&fit=crop"
  },
  {
    title: "Use Natural Light During the Day",
    description: "Open curtains and blinds to use natural daylight instead of switching on electric lights. Submit a photo of a well-lit room using only natural light.",
    points: 15, category: "energy",
    imageUrl: "https://images.unsplash.com/photo-1501183638710-841dd1904471?w=600&auto=format&fit=crop"
  },
  {
    title: "Reduce Unnecessary Fan/AC Usage",
    description: "Reduce your use of fans or air conditioning for a day by opening windows or using natural ventilation instead. Submit a photo showing windows open or fans/AC switched off.",
    points: 20, category: "energy",
    imageUrl: "https://images.unsplash.com/photo-1566699441082-5ee86eb2b45f?w=600&auto=format&fit=crop"
  },
  {
    title: "Use Solar-Powered Lighting",
    description: "Install or use a solar-powered light in your home or outdoor area. Submit a photo of the solar light in use.",
    points: 40, category: "energy",
    imageUrl: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&auto=format&fit=crop"
  },
  {
    title: "Check Appliances Are Off Before Leaving",
    description: "Before leaving your home, check that all appliances and lights are switched off. Submit a photo showing appliances and lights off as you leave.",
    points: 20, category: "energy",
    imageUrl: "/uploads/off.jpg"
  },

  // ── Water-Saving Tasks ────────────────────────────────────
  {
    title: "Turn Off Tap While Brushing",
    description: "Turn off the tap while brushing your teeth instead of letting it run. Ask someone to take a photo of you brushing with the tap off.",
    points: 10, category: "water",
    imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&auto=format&fit=crop"
  },
  {
    title: "Repair or Report a Leaking Tap",
    description: "Fix a leaking tap yourself or report it to the relevant person/authority to get it repaired. Submit a photo of the repaired tap or your report confirmation.",
    points: 50, category: "water",
    imageUrl: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&auto=format&fit=crop"
  },
  {
    title: "Take a Shorter Shower",
    description: "Limit your shower to 5 minutes or less. Ask someone to verify or set a timer and take a photo of the timer showing 5 minutes or under.",
    points: 20, category: "water",
    imageUrl: "/uploads/shower.jpg"
  },
  {
    title: "Reuse Suitable Household Water",
    description: "Collect and reuse water from a suitable household source — such as rinsing water, cooled cooking water, or washing-up water — for watering plants or cleaning. Submit a photo showing how you reused the water.",
    points: 30, category: "water",
    imageUrl: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&auto=format&fit=crop"
  },
  {
    title: "Collect Rainwater for Plants",
    description: "Set up a container or barrel to collect rainwater and use it to water your plants. Submit a photo of your rainwater collection setup.",
    points: 40, category: "water",
    imageUrl: "/uploads/rainwater.jpg"
  },
  {
    title: "Close Taps Properly After Use",
    description: "Make sure all taps in your home are properly closed after use and check for any that were left dripping. Submit a photo of you checking and closing taps around your home.",
    points: 10, category: "water",
    imageUrl: "/uploads/tap.jpg"
  },

  // ── Domestic Chores ───────────────────────────────────────
  {
    title: "Sweep the House",
    description: "Sweep the floors throughout your home. Submit a photo of the clean swept floor.",
    points: 20, category: "domestic",
    imageUrl: "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=600&auto=format&fit=crop"
  },
  {
    title: "Mop the Floor",
    description: "Mop the floors in your home until clean. Submit a photo of the freshly mopped floor.",
    points: 25, category: "domestic",
    imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop"
  },
  {
    title: "Wash Dishes",
    description: "Wash all the dirty dishes in the kitchen. Submit a photo of the clean, stacked dishes.",
    points: 20, category: "domestic",
    imageUrl: "/uploads/washdish.jpg"
  },
  {
    title: "Clean Your Room",
    description: "Tidy and clean your bedroom from top to bottom. Submit a before and after photo.",
    points: 30, category: "domestic",
    imageUrl: "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=600&auto=format&fit=crop"
  },
  {
    title: "Make Your Bed",
    description: "Neatly make your bed with clean sheets and arranged pillows. Submit a photo of your made bed.",
    points: 10, category: "domestic",
    imageUrl: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&auto=format&fit=crop"
  },
  {
    title: "Wash Clothes",
    description: "Wash a load of clothes by hand or machine. Submit a photo of the clean, washed clothes.",
    points: 30, category: "domestic",
    imageUrl: "/uploads/wash.jpg"
  },
  {
    title: "Fold and Arrange Clothes",
    description: "Fold and neatly arrange clean clothes. Submit a photo of the folded and organised clothes.",
    points: 20, category: "domestic",
    imageUrl: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&auto=format&fit=crop"
  },
  {
    title: "Clean the Kitchen",
    description: "Thoroughly clean the kitchen — wipe surfaces, clean the cooker, and tidy worktops. Submit a photo of the clean kitchen.",
    points: 30, category: "domestic",
    imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&auto=format&fit=crop"
  },
  {
    title: "Clean the Bathroom",
    description: "Scrub and clean the bathroom including the toilet, sink, and floor. Submit a photo of the clean bathroom.",
    points: 40, category: "domestic",
    imageUrl: "/uploads/bathroom.jpg"
  },
  {
    title: "Clean Windows",
    description: "Clean the windows inside and/or outside your home until they are streak-free. Submit a photo of the clean windows.",
    points: 30, category: "domestic",
    imageUrl: "https://images.unsplash.com/photo-1527515637462-cff94ead201b?w=600&auto=format&fit=crop"
  },
  {
    title: "Take Out the Rubbish",
    description: "Empty all rubbish bins in your home and take the bags to the outdoor bin or collection point. Submit a photo showing the emptied bins.",
    points: 20, category: "domestic",
    imageUrl: "https://images.unsplash.com/photo-1604187351574-c75ca79f5807?w=600&auto=format&fit=crop"
  },
  {
    title: "Organise Your Wardrobe",
    description: "Sort, organise, and arrange your wardrobe neatly. Submit a before and after photo of the inside of your wardrobe.",
    points: 30, category: "domestic",
    imageUrl: "/uploads/wardrope.jpg"
  },
  {
    title: "Clean Your Study/Work Area",
    description: "Tidy and clean your desk, study, or work area. Submit a photo of your clean and organised workspace.",
    points: 20, category: "domestic",
    imageUrl: "https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=600&auto=format&fit=crop"
  },
  {
    title: "Wash the Car",
    description: "Wash your family car by hand inside and out. Submit a photo of the clean car.",
    points: 40, category: "domestic",
    imageUrl: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=600&auto=format&fit=crop"
  },
  {
    title: "Clean the Compound",
    description: "Sweep, tidy, and clean the outdoor compound or yard around your home. Submit a photo of the clean compound.",
    points: 50, category: "domestic",
    imageUrl: "/uploads/compound.jpg"
  },
  {
    title: "Help Prepare a Meal",
    description: "Help prepare a full meal for your family — chopping, cooking, or setting the table counts. Submit a photo of the meal you helped prepare.",
    points: 30, category: "domestic",
    imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&auto=format&fit=crop"
  },
  {
    title: "Help an Elderly Family Member with Chores",
    description: "Assist an elderly parent, grandparent, or relative with household chores. Submit a photo of you helping them.",
    points: 50, category: "domestic",
    imageUrl: "https://images.unsplash.com/photo-1516307365426-bea591f05011?w=600&auto=format&fit=crop"
  },
  {
    title: "Fetch Water for Household Use",
    description: "Fetch or carry water for use in your household (cooking, cleaning, or drinking). Submit a photo of you fetching or delivering the water.",
    points: 20, category: "domestic",
    imageUrl: "/uploads/water.jpg"
  },
  {
    title: "Arrange Household Items",
    description: "Tidy and arrange items around your home — shelves, living room, storage areas. Submit a photo of the neatly arranged space.",
    points: 20, category: "domestic",
    imageUrl: "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=600&auto=format&fit=crop"
  },
  {
    title: "Clean Household Appliances",
    description: "Clean at least two household appliances (e.g. fridge, microwave, washing machine, fan). Submit a photo of the cleaned appliances.",
    points: 30, category: "domestic",
    imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop"
  },

  // ── Environmental Tasks ───────────────────────────────────
  {
    title: "Plant a Tree/Seedling",
    description: "Plant a tree or seedling in your garden, yard, or local green space. Submit a photo of you with the planted tree or seedling.",
    points: 100, category: "general",
    imageUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop"
  },
  {
    title: "Water a Plant",
    description: "Water a plant at home, school, or in your community. Submit a photo of you watering the plant.",
    points: 20, category: "general",
    imageUrl: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=600&auto=format&fit=crop"
  },
  {
    title: "Remove Weeds Around a Plant",
    description: "Remove weeds from around a plant to help it grow better. Submit a before and after photo showing the area cleared.",
    points: 30, category: "general",
    imageUrl: "/uploads/removeweed.jpg"
  },
  {
    title: "Create a Small Home Garden",
    description: "Set up a small garden at home using pots, raised beds, or a patch of soil. Submit a photo of your garden setup with plants growing.",
    points: 100, category: "general",
    imageUrl: "/uploads/homegarden.jpg"
  },
  {
    title: "Care for an Existing Tree",
    description: "Water, mulch, or generally care for an existing tree in your area. Submit a photo showing the care you provided.",
    points: 40, category: "general",
    imageUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop"
  },
  {
    title: "Pick Up Litter Around Your Compound",
    description: "Pick up litter around your home, compound, or immediate surroundings. Submit a photo of the litter collected.",
    points: 50, category: "general",
    imageUrl: "/uploads/pict.jpg"
  },
  {
    title: "Clean a Public Area",
    description: "Clean a public area such as a park, street, or community space. Submit before and after photos of the area.",
    points: 100, category: "general",
    imageUrl: "/uploads/clean.avif"
  },
  {
    title: "Collect Plastic Bottles for Recycling",
    description: "Collect plastic bottles and take them to a recycling point or drop-off. Submit a photo of the bottles collected and, if possible, at the recycling point.",
    points: 50, category: "general",
    imageUrl: "/uploads/bottle.jpg"
  },
  {
    title: "Separate Recyclable Waste",
    description: "Sort your household waste into recyclable and non-recyclable categories. Submit a photo of your sorted waste.",
    points: 40, category: "general",
    imageUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600&auto=format&fit=crop"
  },
  {
    title: "Reuse an Old Container",
    description: "Find a creative way to reuse an old container — as a planter, storage unit, or something else. Submit a photo of the repurposed container.",
    points: 30, category: "general",
    imageUrl: "/uploads/can.jpg"
  },
  {
    title: "Use a Reusable Shopping Bag",
    description: "Go shopping using a reusable bag instead of a plastic bag. Submit a photo of you shopping with your reusable bag.",
    points: 20, category: "general",
    imageUrl: "/uploads/bag.jpg"
  },
  {
    title: "Avoid Single-Use Plastic for a Day",
    description: "Spend an entire day avoiding all single-use plastic — no plastic bags, bottles, straws, or packaging. Document your plastic-free choices with photos.",
    points: 30, category: "general",
    imageUrl: "/uploads/plastic.jpg"
  },
  {
    title: "Clean a Drainage Area Safely",
    description: "Safely help clean a blocked or dirty drainage area in your community. Submit a before and after photo. Always prioritise your safety.",
    points: 80, category: "general",
    imageUrl: "/uploads/Drainage.jpg"
  },
  {
    title: "Report Illegal Dumping",
    description: "Report a case of illegal dumping to your local council or environmental authority. Submit a photo of the dumping site and a screenshot or photo of your report submission.",
    points: 50, category: "general",
    imageUrl: "/uploads/report.jpg"
  },
  {
    title: "Create a Compost Pile",
    description: "Set up a compost pile or bin at home using food scraps and garden waste. Submit a photo of your compost setup and what you've added to it.",
    points: 100, category: "general",
    imageUrl: "/uploads/compostbin.jpg"
  },

  // ── General tasks ─────────────────────────────────────────
  {
    title: "Plant a Tree",
    description: "Plant a tree in your neighborhood or local park and submit a photo of you with the planted tree.",
    points: 50, category: "general",
    imageUrl: "/uploads/planttree1.jpg"
  },
  {
    title: "Plastic-Free Day",
    description: "Go an entire day without using single-use plastic. Document your plastic-free choices.",
    points: 30, category: "general",
    imageUrl: "/uploads/plasticbag.jpg"
  },
  {
    title: "Bike to Work",
    description: "Use a bicycle instead of a car for your commute. Submit a photo of your bike at your destination.",
    points: 25, category: "general",
    imageUrl: "/uploads/Biketowork.jpg"
  },
  {
    title: "Community Clean-Up",
    description: "Participate in or organise a local clean-up event. Submit a before and after photo.",
    points: 40, category: "general",
    imageUrl: "/uploads/communityclean.jpg"
  },
  {
    title: "Reduce Energy Use",
    description: "Turn off all non-essential appliances for 24 hours and document the steps you took.",
    points: 20, category: "general",
    imageUrl: "/uploads/turnoff.jpg"
  },
  {
    title: "Compost Waste",
    description: "Set up a compost bin at home and submit a photo of your compost setup.",
    points: 35, category: "general",
    imageUrl: "/uploads/setbin.jpg"
  },

  // ── Hard tasks ────────────────────────────────────────────
  {
    title: "Install a Rainwater Harvesting System",
    description: "Build or install a rainwater collection system at your home. Submit photos of the setup and explain how you plan to use the water.",
    points: 120, category: "hard",
    imageUrl: "/uploads/rainwater.jpg"
  },
  {
    title: "Switch to Solar Energy",
    description: "Install solar panels or a solar-powered device at your home or workplace. Submit a photo and your energy bill comparison before and after.",
    points: 200, category: "hard",
    imageUrl: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&auto=format&fit=crop"
  },
  {
    title: "Run a 30-Day Zero Waste Challenge",
    description: "Commit to producing zero landfill waste for 30 days. Keep a daily log, take weekly photos of your rubbish, and submit a final summary report.",
    points: 150, category: "hard",
    imageUrl: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&auto=format&fit=crop"
  },
  {
    title: "Organise a School or Workplace Eco Workshop",
    description: "Plan and run an environmental awareness workshop for at least 10 people. Submit your workshop materials, attendance list, and photos from the event.",
    points: 180, category: "hard",
    imageUrl: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&auto=format&fit=crop"
  },
  {
    title: "Create a Wildlife Garden",
    description: "Transform part of your garden into a wildlife-friendly habitat with native plants, a bird feeder, or an insect hotel. Submit before/after photos and a description of species attracted.",
    points: 100, category: "hard",
    imageUrl: "/uploads/garden.jpg"
  },
  {
    title: "Complete a 5km Plogging Run",
    description: "Plogging is jogging while picking up litter. Run at least 5km collecting rubbish along the way. Submit your route map, a photo of the waste collected, and your run time.",
    points: 75, category: "hard",
    imageUrl: "/uploads/runpick.jpg"
  },
  {
    title: "Go Car-Free for One Month",
    description: "Commit to using only public transport, cycling, or walking for an entire month. Submit a weekly travel log with photos and a final reflection on your carbon savings.",
    points: 250, category: "hard",
    imageUrl: "/uploads/carfree.jpg"
  },
  {
    title: "Plant and Harvest a Vegetable Garden",
    description: "Grow your own vegetables from seed to harvest. Document the full journey with photos from planting, growing, and harvesting stages over at least 6 weeks.",
    points: 130, category: "hard",
    imageUrl: "/uploads/grow.jpg"
  },

  // ── Children's tasks ──────────────────────────────────────
  {
    title: "Draw a Save the Earth Poster",
    description: "Draw or paint a colourful poster about saving the planet. Ask a grown-up to take a photo of your artwork and submit it!",
    points: 10, category: "children",
    imageUrl: "/uploads/draw.jpg"
  },
  {
    title: "Water a Plant Every Day for a Week",
    description: "Pick a plant at home or school and water it every day for 7 days. Take a photo of the plant on day 1 and day 7 to show how it's growing!",
    points: 15, category: "children",
    imageUrl: "/uploads/waterplant.jpg"
  },
  {
    title: "Pick Up 10 Pieces of Litter",
    description: "With a grown-up's help, pick up 10 pieces of litter in your street, park, or school playground. Take a photo of the litter you collected!",
    points: 15, category: "children",
    imageUrl: "/uploads/pick.jpg"
  },
  {
    title: "Learn 5 Recycling Facts",
    description: "Learn 5 interesting facts about recycling and write or draw them on a piece of paper. Ask a grown-up to take a photo and submit it!",
    points: 10, category: "children",
    imageUrl: "/uploads/recycle.jpg"
  },
  {
    title: "Turn Off Lights When Leaving a Room",
    description: "For one whole day, make sure you turn off every light when you leave a room. Ask a parent or teacher to confirm you did it and submit a photo of you switching off a light!",
    points: 10, category: "children",
    imageUrl: "/uploads/offlight.jpg"
  },
  {
    title: "Make a Bird Feeder from Recycled Materials",
    description: "Use an old bottle, cardboard, or other recycled items to make a bird feeder. Hang it outside and submit a photo of your creation — bonus points if a bird visits!",
    points: 25, category: "children",
    imageUrl: "/uploads/bird-feeder.jpg"
  },
  {
    title: "Plant Seeds in a Cup",
    description: "Plant flower or vegetable seeds in a paper cup using soil from your garden. Water them and watch them grow! Submit a photo of your seedlings sprouting.",
    points: 20, category: "children",
    imageUrl: "/uploads/seed.jpg"
  },
  {
    title: "Have a Screen-Free Outdoor Day",
    description: "Spend a whole day outside without any screens — play, explore nature, and enjoy the environment! Submit a photo of your favourite moment from the day.",
    points: 20, category: "children",
    imageUrl: "/uploads/kids.jpg"
  },
  {
    title: "Teach a Friend About Recycling",
    description: "Explain to a friend or family member how to sort rubbish into the correct recycling bins. Submit a photo of you both with the recycling bins.",
    points: 15, category: "children",
    imageUrl: "/uploads/teachfriend.jpg"
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URL);
  console.log("Connected to MongoDB");

  // Create or update admin
  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (!existing) {
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await User.create({ name: "Admin", email: ADMIN_EMAIL, password: hashed, isAdmin: true });
    console.log("✅ Admin user created");
    console.log("   Email:   ", ADMIN_EMAIL);
    console.log("   Password:", ADMIN_PASSWORD);
  } else {
    await User.findOneAndUpdate({ email: ADMIN_EMAIL }, { isAdmin: true });
    console.log("✅ Admin already exists, ensured isAdmin=true");
  }

  // Only re-seed tasks if count is less than expected (handles new tasks being added)
  const existingCount = await Task.countDocuments();
  if (existingCount < SEED_TASKS.length) {
    await Task.deleteMany({});
    await Task.insertMany(SEED_TASKS.map(t => ({
      ...t,
      proofLevel: proofLevel(t.points, t.taskType),
    })));
    console.log(`✅ Seeded ${SEED_TASKS.length} tasks with images and proof levels`);
  } else {
    // Patch individual task images that may have changed
    const imagePatches = SEED_TASKS.map(t => ({
      title: t.title,
      imageUrl: t.imageUrl,
    }));
    let patched = 0;
    for (const patch of imagePatches) {
      const result = await Task.updateOne({ title: patch.title }, { $set: { imageUrl: patch.imageUrl } });
      if (result.modifiedCount > 0) patched++;
    }
    console.log(`ℹ️  Tasks already seeded (${existingCount} in DB). Patched ${patched} image(s).`);
  }

  // Seed rewards if none exist
  const rewardCount = await Reward.countDocuments();
  if (rewardCount === 0) {
    await Reward.insertMany([
      // ── Tier 1 ──
      {
        title: "Global eVoucher — Starter (100 pts)",
        description: "Approx. value: £5 / $6 / €6 / ₦8,000 / GH₵75 / R$30 / R100 / KSh800. Delivered as a PayPal payment or local mobile money transfer to your registered email. Available in all countries.",
        pointsCost: 100, category: "voucher", currency: "GLOBAL", region: "Global", flag: "🌍",
        imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&auto=format&fit=crop",
        stock: -1, available: true
      },
      // ── Tier 2 ──
      {
        title: "Global eVoucher — Explorer (250 pts)",
        description: "Approx. value: £12 / $15 / €14 / ₦20,000 / GH₵190 / R$75 / R250 / KSh2,000. Delivered as a PayPal payment or local mobile money transfer. Available in all countries.",
        pointsCost: 250, category: "voucher", currency: "GLOBAL", region: "Global", flag: "🌍",
        imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&auto=format&fit=crop",
        stock: -1, available: true
      },
      // ── Tier 3 ──
      {
        title: "Global eVoucher — Champion (500 pts)",
        description: "Approx. value: £25 / $30 / €28 / ₦40,000 / GH₵380 / R$150 / R500 / KSh4,000. Delivered as a PayPal payment or local mobile money transfer. Available in all countries.",
        pointsCost: 500, category: "voucher", currency: "GLOBAL", region: "Global", flag: "🌍",
        imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&auto=format&fit=crop",
        stock: -1, available: true
      },
      // ── Tier 4 ──
      {
        title: "Global eVoucher — Legend (1000 pts)",
        description: "Approx. value: £50 / $60 / €55 / ₦80,000 / GH₵760 / R$300 / R1000 / KSh8,000. Delivered as a PayPal payment or local mobile money transfer. Available in all countries.",
        pointsCost: 1000, category: "voucher", currency: "GLOBAL", region: "Global", flag: "🌍",
        imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&auto=format&fit=crop",
        stock: -1, available: true
      },
      // ── Google Play ──
      {
        title: "Google Play Gift Card $5",
        description: "A $5 Google Play gift card — usable in 190+ countries for apps, games, movies, books, and more. Code sent to your email. Available worldwide.",
        pointsCost: 150, category: "voucher", currency: "USD", region: "Global", flag: "🌍",
        imageUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&auto=format&fit=crop",
        stock: -1, available: true
      },
      {
        title: "Google Play Gift Card $10",
        description: "A $10 Google Play gift card usable in 190+ countries. Perfect for apps, games, and digital content. Code sent to your email.",
        pointsCost: 300, category: "voucher", currency: "USD", region: "Global", flag: "🌍",
        imageUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&auto=format&fit=crop",
        stock: -1, available: true
      },
      // ── Amazon ──
      {
        title: "Amazon Gift Card $10",
        description: "A $10 Amazon gift card redeemable on Amazon.com and many international Amazon stores. Code sent to your email. Available worldwide.",
        pointsCost: 300, category: "voucher", currency: "USD", region: "Global", flag: "🌍",
        imageUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&auto=format&fit=crop",
        stock: -1, available: true
      },
      // ── Non-cash global ──
      {
        title: "Tree Planting Certificate 🌳",
        description: "We plant a real tree in your name through our reforestation partners. Receive a personalised digital certificate by email. Available worldwide.",
        pointsCost: 150, category: "digital", currency: "ALL", region: "Global", flag: "🌍",
        imageUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&auto=format&fit=crop",
        stock: -1, available: false // disabled — requires manual physical fulfilment
      },
      // Green Earth Eco Tote Bag removed — physical merchandise cannot be fulfilled digitally
    ]);
    console.log("✅ Seeded global rewards available in all countries");
  } else {
    console.log(`ℹ️  Rewards already exist (${rewardCount}), skipping reward seed`);
  }

  await mongoose.disconnect();
  console.log("Done.");
}

seed().catch(err => { console.error(err); process.exit(1); });
