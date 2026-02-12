// src/data/timelineData.js

export const CATEGORIES = {
  FOUNDATIONS: "FOUNDATIONS",
  TECHNIQUES: "TECHNIQUES",
  MILESTONES: "MILESTONES",
  MODELS: "MODELS",
  ADOPTION: "ADOPTION",
};

export const TIMELINE_DATA = {
  events: [
    {
    "start_date": {
      "year": "1950",
      "month": "10",
      "day": "01"
    },
    "custom_date": "1950",
    "text": {
      "headline": "Can machines think? ",
      "text": "<p>Alan Turing published &quot;Computing Machinery and Intelligence,&quot; proposing the &quot;Imitation Game&quot; (Turing Test) to define machine intelligence based on it&#x27;s ability to exhibit human-like conversation.</p>"
    },
    "chinese": {
      "headline": "The Turing Test",
      "text": "<p>Alan Turing published &quot;Computing Machinery and Intelligence,&quot; proposing the &quot;Imitation Game&quot; (Turing Test) to define machine intelligence based on a machine&#x27;s ability to exhibit human-like conversation.</p>"
    },
    "importance": 3,
    "category": CATEGORIES.FOUNDATIONS,
    "iconKey": "canMachinesThink",
    "media": {
      "url": "",
      "alt": "",
      "source": ""
    }
  },
  {
    "start_date": {
      "year": "1958",
      "month": "01",
      "day": "01"
    },
    "custom_date": "1958",
    "text": {
      "headline": "Perceptron: The birth of Neural Networks",
      "text": "<p>Frank Rosenblatt creates the Perceptron, an early algorithm for pattern recognition that became the fundamental building block for modern deep learning.</p>"
    },
    "chinese": {
      "headline": "Perceptron: The birth of Neural Networks",
      "text": "<p>Frank Rosenblatt creates the Perceptron, an early algorithm for pattern recognition that became the fundamental building block for modern deep learning.</p>"
    },
    "importance": 3,
    "category": CATEGORIES.FOUNDATIONS,
    "iconKey": "neuralNet",
    "media": {
      "url": "",
      "alt": "AI Timeline Event",
      "source": ""
    }
  },
  {
    "start_date": {
      "year": "1966",
      "month": "01",
      "day": "01"
    },
    "custom_date": "1966",
    "text": {
      "headline": "ELIZA: When Machines First Felt Human",
      "text": "<p>Joseph Weizenbaum at MIT created ELIZA, the world’s first chatbot simulating Rogerian Psychotherapy. While it used simple pattern matching, it revealed the human tendency to project empathy and deep understanding onto a machine (ELIZA effect).</p>"
    },
    "chinese": {
      "headline": "ELIZA: When Machines First Felt Human",
      "text": "<p>Joseph Weizenbaum at MIT created ELIZA, the world’s first chatbot simulating Rogerian Psychotherapy. While it used simple pattern matching, it revealed the human tendency to project empathy and deep understanding onto a machine (ELIZA effect).</p>"
    },
    "importance": 3,
    "category": CATEGORIES.FOUNDATIONS,
    "iconKey": "eliza",
    "media": {
      "url": "/ai_timeline_imgs/eliza.jpg",
      "alt": "AI Timeline Event",
      "source": "Wikipedia"
    }
  },
  {
    "start_date": {
      "year": "1975",
      "month": "01",
      "day": "01"
    },
    "custom_date": "1970s-1980s",
    "text": {
      "headline": "Expert Systems & the AI winters",
      "text": "<p>Rule-based systems designed to mimic expert decision-making are adopted in business and medicine. This was followed by a period of stagnation as the capabilities of AI systems remained limited, largely due to the lack of compute.</p>"
    },
    "chinese": {
      "headline": "Expert Systems & the AI winters",
      "text": "<p>Rule-based systems designed to mimic expert decision-making are adopted in business and medicine. This was followed by a period of stagnation as the capabilities of AI systems remained limited, largely due to the lack of compute.</p>"
    },
    "importance": 3,
    "category": CATEGORIES.FOUNDATIONS,
    "iconKey": "expertSystems",
    "media": {
      "url": "",
      "alt": "",
      "source": ""
    }
  },
  {
    "start_date": {
      "year": "1986",
      "month": "09",
      "day": "01"
    },
    "custom_date": "1986",
    "text": {
      "headline": "The Backpropagation Breakthrough",
      "text": "<p>Geoffrey Hinton, David Rumelhart, and Ronald Williams popularized the backpropagation algorithm. This allowed multi-layer neural networks to &quot;learn&quot; by efficiently updating weights based on error rates.</p>"
    },
    "chinese": {
      "headline": "The Backpropagation Breakthrough",
      "text": "<p>Geoffrey Hinton, David Rumelhart, and Ronald Williams popularized the backpropagation algorithm. This allowed multi-layer neural networks to &quot;learn&quot; by efficiently updating weights based on error rates.</p>"
    },
    "importance": 3,
    "category": CATEGORIES.TECHNIQUES,
    "iconKey": "backpropagation",
    "media": {
      "url": "",
      "alt": "",
      "source": ""
    }
  },
  {
    "start_date": {
      "year": "1995",
      "month": "06",
      "day": "01"
    },
    "custom_date": "1990s-2000s",
    "text": {
      "headline": "Foundations of Probabilistic Deep Learning",
      "text": "<p>This period established core principles and foundation architectures of modern deep learning which later became a cornerstone of AI systems.</p> <p>For vision systems, Convolution Neural Networks (CNNs) we invented for handwritten digit recognition. Recurrent Neural Networks (RNNs), Long Short-Term Memory (LSTMs) were also developed in these decades, forming building blocks of future NLP, speech and sequential modelling.</p>"
    },
    "chinese": {
      "headline": "Foundations of Probabilistic Deep Learning",
      "text": "<p>This period established core principles and foundation architectures of modern deep learning which later became a cornerstone of AI systems.</p> <p>For vision systems, Convolution Neural Networks (CNNs) we invented for handwritten digit recognition. Recurrent Neural Networks (RNNs), Long Short-Term Memory (LSTMs) were also developed in these decades, forming building blocks of future NLP, speech and sequential modelling.</p>"
    },
    "importance": 3,
    "category": CATEGORIES.TECHNIQUES,
    "iconKey": "neuralNet",
    "media": {
      "url": "",
      "alt": "",
      "source": ""
    }
  },
  {
    "start_date": {
      "year": "1995",
      "month": "01",
      "day": "01"
    },
    "custom_date": "1990s-2000s",
    "text": {
      "headline": "Statistical Machine Learning Takes Off",
      "text": "Advancement of statistical machine learning algorithms like AdaBoost, SVMs, Random Forest led to the shift into data-driven discovery with ability to handle high-dimensionality and noise. These build foundations for GBDTs and XGBoost (2014) the \"go-to\" algorithms for structured data tasks in future."
    },
    "chinese": {
      "headline": "Statistical Machine Learning Takes Off",
      "text": "Advancement of statistical machine learning algorithms like AdaBoost, SVMs, Random Forest led to the shift into data-driven discovery with ability to handle high-dimensionality and noise. These build foundations for GBDTs and XGBoost (2014) the \"go-to\" algorithms for structured data tasks in future."
    },
    "importance": 3,
    "category": CATEGORIES.TECHNIQUES,
    "iconKey": "machineLearning",
    "media": {
      "url": "",
      "alt": "",
      "source": ""
    }
  },
  {
    "start_date": {
      "year": "1997",
      "month": "05",
      "day": "01"
    },
    "custom_date": "May 1997",
    "text": {
      "headline": "Grandmaster AI?",
      "text": "<p>Supercomputer Deep Blue defeated world chess champion Garry Kasparov. This was a watershed moment proving that &quot;brute-force&quot; search and heuristic evaluation could beat the best human strategic thinkers.</p>"
    },
    "chinese": {
      "headline": "Grandmaster AI?",
      "text": "<p>Supercomputer Deep Blue defeated world chess champion Garry Kasparov. This was a watershed moment proving that &quot;brute-force&quot; search and heuristic evaluation could beat the best human strategic thinkers.</p>"
    },
    "media": {
      "url": "/ai_timeline_imgs/1996_deep-blue_320_16x9.avif",
      "alt": "",
      "source": "Gemini"
    },
    "importance": 3,
    "category": CATEGORIES.MILESTONES,
    "iconKey": "grandmasterAi"
  },
  {
    "start_date": {
      "year": "2009",
      "month": "01",
      "day": "01"
    },
    "custom_date": "2009",
    "text": {
      "headline": "ImageNet Ignites the Computer Vision Revolution",
      "text": "<p>Launch of the ImageNet Challenge sparks a wave of breakthroughs in computer vision, laying the groundwork for modern data-driven learning.</p>"
    },
    "chinese": {
      "headline": "ImageNet Ignites the Computer Vision Revolution",
      "text": "<p>Launch of the ImageNet Challenge sparks a wave of breakthroughs in computer vision, laying the groundwork for modern data-driven learning.</p>"
    },
    "media": {
      "url": "",
      "alt": "",
      "source": ""
    },
    "importance": 3,
    "category": CATEGORIES.FOUNDATIONS,
    "iconKey": "computerVision"
  },
  {
    "start_date": {
      "year": "2012",
      "month": "09",
      "day": "01"
    },
    "custom_date": "2012",
    "text": {
      "headline": "The AlexNet Moment",
      "text": "<p>Alex Krizhevsky and Geoffrey Hinton won the ImageNet competition using a Deep Convolutional Neural Network (CNN). Alexnet used components like ReLU activation, dropout, and GPU accelerated learning to end up with 16% error rate, nearly half that of the next competitor.</p>"
    },
    "chinese": {
      "headline": "The AlexNet Moment",
      "text": "<p>Alex Krizhevsky and Geoffrey Hinton won the ImageNet competition using a Deep Convolutional Neural Network (CNN). Alexnet used components like ReLU activation, dropout, and GPU accelerated learning to end up with 16% error rate, nearly half that of the next competitor.</p>"
    },
    "importance": 3,
    "category": CATEGORIES.MILESTONES,
    "iconKey": "backpropagation_breakthrough",
    "media": {
      "url": "",
      "alt": "",
      "source": ""
    }
  },
  {
    "start_date": {
      "year": "2014",
      "month": "06",
      "day": "01"
    },
    "custom_date": "2014",
    "text": {
      "headline": "Generative Adversarial Networks (GANs)",
      "text": "<p>Ian Goodfellow introduced GANs, a framework where two neural networks (a generator and a discriminator) compete. This enabled the creation of highly realistic synthetic data, such as &quot;Deepfakes&quot; and &quot;AI art.&quot;</p>"
    },
    "chinese": {
      "headline": "Generative Adversarial Networks (GANs)",
      "text": "<p>Ian Goodfellow introduced GANs, a framework where two neural networks (a generator and a discriminator) compete. This enabled the creation of highly realistic synthetic data, such as &quot;Deepfakes&quot; and &quot;AI art.&quot;</p>"
    },
    "importance": 3,
    "category": CATEGORIES.TECHNIQUES,
    "iconKey": "gan",
    "media": {
      "url": "",
      "alt": "",
      "source": ""
    }
  },
  {
    "start_date": {
      "year": "2016",
      "month": "03",
      "day": "01"
    },
    "custom_date": "March 2016",
    "text": {
      "headline": "AlphaGo vs. Lee Sedol",
      "text": "<p>AlphaGo defeated 18-time world champion Lee Sedol in the game of Go. Shortly after, in 2017, AlphaGo Zero – a significantly more advanced and efficient successor, was released, shifting from learning via human expertise to pure, self-taught reinforcement learning.</p>"
    },
    "chinese": {
      "headline": "AlphaGo vs. Lee Sedol",
      "text": "<p>AlphaGo defeated 18-time world champion Lee Sedol in the game of Go. Shortly after, in 2017, AlphaGo Zero – a significantly more advanced and efficient successor, was released, shifting from learning via human expertise to pure, self-taught reinforcement learning.</p>"
    },
    "importance": 3,
    "category": CATEGORIES.MILESTONES,
    "iconKey": "hackathons",
    "media": {
      "url": "",
      "alt": "",
      "source": ""
    }
  },
  {
    "start_date": {
      "year": "2017",
      "month": "06",
      "day": "01"
    },
    "custom_date": "June 2017",
    "text": {
      "headline": "The Transformer Paper",
      "text": "<p>Landmark paper &quot;Attention Is All You Need,&quot; is published, introducing the Transformer architecture. It replaced recurrent processing with &quot;self-attention,&quot; allowing models to process entire sequences of data simultaneously.</p>"
    },
    "chinese": {
      "headline": "The Transformer Paper",
      "text": "<p>Landmark paper &quot;Attention Is All You Need,&quot; is published, introducing the Transformer architecture. It replaced recurrent processing with &quot;self-attention,&quot; allowing models to process entire sequences of data simultaneously.</p>"
    },
    "importance": 3,
    "category": CATEGORIES.TECHNIQUES,
    "iconKey": "transformer",
    "media": {
      "url": "",
      "alt": "",
      "source": ""
    }
  },
  {
    "start_date": {
      "year": "2018",
      "month": "06",
      "day": "01"
    },
    "custom_date": "June 2018",
    "text": {
      "headline": "GPT-1 and BERT",
      "text": "<p>Release of GPT-1 model, followed by BERT in November. These models proved that pre-training massive datasets followed by fine-tuning could solve a wide array of NLP tasks with a single architecture.</p>"
    },
    "chinese": {
      "headline": "GPT-1 and BERT",
      "text": "<p>Release of GPT-1 model, followed by BERT in November. These models proved that pre-training massive datasets followed by fine-tuning could solve a wide array of NLP tasks with a single architecture.</p>"
    },
    "importance": 3,
    "category": CATEGORIES.MODELS,
    "iconKey": "publications",
    "media": {
      "url": "",
      "alt": "",
      "source": ""
    }
  },
  {
    "start_date": {
      "year": "2020",
      "month": "06",
      "day": "01"
    },
    "custom_date": "June 2020",
    "text": {
      "headline": "GPT-3",
      "text": "<p>Release of the largest ever LM GPT-3 with 175 billion parameters. Its ability to write code, poetry, and legal documents with minimal prompting signaled that &quot;scaling&quot; models (adding more data and parameters) led to emergent reasoning abilities. In comparison, the largest LLMs today use 6x more parameters.</p>"
    },
    "chinese": {
      "headline": "GPT-3",
      "text": "<p>Release of the largest ever LM GPT-3 with 175 billion parameters. Its ability to write code, poetry, and legal documents with minimal prompting signaled that &quot;scaling&quot; models (adding more data and parameters) led to emergent reasoning abilities. In comparison, the largest LLMs today use 6x more parameters.</p>"
    },
    "media": {
      "url": "",
      "alt": "",
      "caption": "",
      "source": ""
    },
    "importance": 3,
    "category": CATEGORIES.MODELS,
    "iconKey": "gpt3"
  },
  {
    "start_date": {
      "year": "2020",
      "month": "11",
      "day": "01"
    },
    "text": {
      "headline": "AlphaFold 2",
      "text": "<p>The Biology Breakthrough: AlphaFold 2 solves the &quot;protein folding problem,&quot; predicting 3D structures with near-perfect accuracy. This achievement addressed a 50-year-old grand challenge in biology, promising to accelerate drug discovery and disease research.</p>"
    },
    "chinese": {
      "headline": "AlphaFold 2",
      "text": "<p>The Biology Breakthrough: AlphaFold 2 solves the &quot;protein folding problem,&quot; predicting 3D structures with near-perfect accuracy. This achievement addressed a 50-year-old grand challenge in biology, promising to accelerate drug discovery and disease research.</p>"
    },
    "importance": 3,
    "category": CATEGORIES.MODELS,
    "iconKey": "alphafold",
    "media": {
      "url": "",
      "alt": "",
      "source": ""
    }
  },
  {
    "start_date": {
      "year": "2022",
      "month": "11",
      "day": "01"
    },
    "custom_date": "November 2022",
    "text": {
      "headline": "AI appears in a consumer facing avatar",
      "text": "<p>The first chatbot powered by Generative AI released for public use. It becomes the fastest growing consumer apps in the history, amassing 100M users in just 2 months!<p>"
    },
    "chinese": {
      "headline": "AI appears in a consumer facing avatar",
      "text": " The first chatbot powered by Generative AI released for public use. It becomes the fastest growing consumer apps in the history, amassing 100M users in just 2 months!<p>"
    },
    "importance": 3,
    "category": CATEGORIES.ADOPTION,
    "iconKey": "consumerAvatar",
    "media": {
      "url": "",
      "alt": "",
      "source": ""
    }
  },
  {
    "start_date": {
      "year": "2023",
      "month": "06",
      "day": "01"
    },
    "custom_date": "June 2023",
    "text": {
      "headline": "Gen AI goes mainstream",
      "text": "<p>Generative AI becomes a household term. From classrooms to boardrooms, the general public begins using AI to brainstorm, write, and create in real-time.</p>"
    },
    "chinese": {
      "headline": "Gen AI goes mainstream",
      "text": "<p>Generative AI becomes a household term. From classrooms to boardrooms, the general public begins using AI to brainstorm, write, and create in real-time.</p>"
    },
    "importance": 3,
    "category": CATEGORIES.ADOPTION,
    "iconKey": "events",
    "media": {
      "url": "",
      "alt": "",
      "source": ""
    }
  },
  {
    "start_date": {
      "year": "2024",
      "month": "01",
      "day": "01"
    },
    "custom_date": "2024",
    "text": {
      "headline": "Search for new frontiers",
      "text": "<p>New models appear with multimodal capabilities, understanding both image and text inputs. New capabilities such as dynamic scene generation from text prompts, realistic video generation, reasoning, and agentic behaviors emerge.</p>"
    },
    "chinese": {
      "headline": "Search for new frontiers",
      "text": "<p>New models appear with multimodal capabilities, understanding both image and text inputs. New capabilities such as dynamic scene generation from text prompts, realistic video generation, reasoning, and agentic behaviors emerge.</p>"
    },
    "importance": 3,
    "category": CATEGORIES.MODELS,
    "iconKey": "searchNewFrontiers",
    "media": {
      "url": "",
      "alt": "",
      "source": ""
    }
  },
  {
    "start_date": {
      "year": "2024",
      "month": "10",
      "day": "01"
    },
    "custom_date": "October 2024",
    "text": {
      "headline": "Double Nobel Recognition for AI Foundations",
      "text": "<p>The 2024 Nobel Prize in Physics is awarded to Hopfield and Hinton for foundational neural network work, while the Nobel Prize in Chemistry is awarded to Hassabis and Jumper for AlphaFold. This marks the integration of AI into the highest levels of fundamental science.</p>"
    },
    "chinese": {
      "headline": "Double Nobel Recognition for AI Foundations",
      "text": "<p>The 2024 Nobel Prize in Physics is awarded to Hopfield and Hinton for foundational neural network work, while the Nobel Prize in Chemistry is awarded to Hassabis and Jumper for AlphaFold. This marks the integration of AI into the highest levels of fundamental science.</p>"
    },
    "importance": 3,
    "category": CATEGORIES.MILESTONES,
    "iconKey": "hackathons",
    "media": {
      "url": "/ai_timeline_imgs/Hinton_Nobel.jpg",
      "alt": "",
      "source": "nobelprize.org"
    }
  },
  {
    "start_date": {
      "year": "2025",
      "month": "01",
      "day": "01"
    },
    "custom_date": "January 2025",
    "text": {
      "headline": "AI’s Sputnik moment",
      "text": "<p>A Chinese open-weight model that matched Western frontier models in reasoning for a fraction of the cost. With innovations like highly efficient reinforcement learning and knowledge distillation, especially on constrained hardware, it triggered a global shift toward cost-efficient reasoning over sheer model size.</p>"
    },
    "chinese": {
      "headline": "AI’s Sputnik moment",
      "text": "<p>A Chinese open-weight model that matched Western frontier models in reasoning for a fraction of the cost. With innovations like highly efficient reinforcement learning and knowledge distillation, especially on constrained hardware, it triggered a global shift toward cost-efficient reasoning over sheer model size.</p>"
    },
    "importance": 3,
    "category": CATEGORIES.MODELS,
    "iconKey": "aiSputnikMoment",
    "media": {
      "url": "",
      "alt": "",
      "source": ""
    }
  },
  {
    "start_date": {
      "year": "2025",
      "month": "03",
      "day": "01"
    },
    "custom_date": "2025",
    "text": {
      "headline": "Agents Go Live!",
      "text": "<p>New use cases for autonomous agents emerge enabled by agentic commerce in consumer AI sphere. Enterprise AI gains widespread adoption while mixed opinions rally on energy efficiency, regulation, and profitability in public discourse.</p>"
    },
    "chinese": {
      "headline": "Agents Go Live!",
      "text": "<p>New use cases for autonomous agents emerge enabled by agentic commerce in consumer AI sphere. Enterprise AI gains widespread adoption while mixed opinions rally on energy efficiency, regulation, and profitability in public discourse.</p>"
    },
    "importance": 3,
    "category": CATEGORIES.ADOPTION,
    "iconKey": "agentsGoLive",
    "media": {
      "url": "",
      "alt": "",
      "source": ""
    }
  },
  ]
};
