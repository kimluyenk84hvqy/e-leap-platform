export const objectivesB1 = {
  id:'objectives-b1', title:'Objectives B1 · Objective PET', classGroup:'CK1',
  units:[{
    id:'u1', title:'Unit 1 · A Question of Sport', totalPeriods:8,
    sourceNote:'Digital lesson mapped from the CK1 course outline and the complete Unit 1.1/1.2 teaching slides. Public demo excludes copyrighted book scans and original commercial audio files.',
    lessons:[
      { id:'u1-1', title:'Lesson 1.1 · A Question of Sport', periods:4,
        outcomes:{
          knowledge:[
            'Identify and use vocabulary related to sports and sports equipment.',
            'Classify and correctly use play / do / go with sports.',
            'Use frequency adverbs: always, usually, often, sometimes, never.',
            'Write a short paragraph describing personal sports habits.'
          ],
          skills:[
            'Identify key information about common and unusual sports.',
            'Ask and answer questions about sports habits.',
            'Use sports-related vocabulary and structures accurately in context.',
            'Write sentences about personal sports habits.'
          ],
          attitudes:[
            'Show a positive attitude toward doing sports and keeping healthy.',
            'Build confidence when using English to talk about personal sports habits.'
          ]
        },
        sections:[
          {type:'warmup', title:'Warm-up · Guess the Sport', summary:'Activate sports vocabulary before the main lesson.',
            intro:'Khởi động bằng hoạt động đoán tên môn thể thao từ hình ảnh/video. Mục tiêu là kích hoạt vốn từ đã biết trước khi vào bài mới.',
            keyPoints:['Quan sát hình và đoán nhanh tên môn thể thao.','Nói câu đầy đủ: “I think it is …” hoặc “They are doing …”.','Không cần dịch sang tiếng Việt trước khi trả lời.'],
            examples:['cycling','horse riding','skiing','basketball','sailing','table tennis','volleyball','tennis','gymnastics','windsurfing','surfing','hockey','football / soccer','rugby','athletics'],
            task:'Chọn 5 môn thể thao bạn biết và nói: tên môn + bạn đã từng chơi/chưa + cảm nhận ngắn.'},

          {type:'vocabulary', title:'Sports Vocabulary · Name the Sports', summary:'Recognise and spell 15 core sports.',
            intro:'Phần Introduction của bài yêu cầu học viên nhận diện và viết đúng tên các môn thể thao.',
            keyPoints:['Chú ý chính tả các từ dài như gymnastics, windsurfing, athletics.','Horse riding gồm hai từ.','Table tennis khác tennis.'],
            examples:['skiing','cycling','basketball','football','gymnastics','hockey','horse riding','rugby','sailing','surfing','table tennis','tennis','volleyball','windsurfing','athletics'],
            miniQuiz:[
              {q:'Which word is spelled correctly?',options:['gymnastic','gymnastics','gymnastick'],answer:1,explain:'Tên môn thể thao là “gymnastics”.'},
              {q:'Which sport has two words?',options:['athletics','horse riding','surfing'],answer:1,explain:'“Horse riding” gồm hai từ.'}
            ],
            task:'Viết lại 15 tên môn thể thao thành 3 nhóm: ball sports / water sports / other sports.'},

          {type:'grammar', title:'Corpus Spot · play / do / go', summary:'Learn the core collocations used with sports.',
            intro:'Từ các ví dụ I play football / I go swimming / I do athletics, học viên rút ra quy tắc sử dụng play, do và go.',
            keyPoints:['play + môn thể thao mang tính trò chơi/đối kháng, thường có bóng hoặc đối thủ.','go + hoạt động thường kết thúc bằng -ing.','do + hoạt động cá nhân, luyện tập, võ thuật hoặc thể dục.'],
            examples:['play football / tennis / volleyball / table tennis','go swimming / surfing / horse riding / cycling / skiing / sailing','do athletics / karate / gymnastics / judo / yoga'],
            miniQuiz:[
              {q:'Choose the correct collocation: ___ volleyball',options:['do','play','go'],answer:1,explain:'Volleyball dùng với play.'},
              {q:'Choose the correct collocation: ___ skiing',options:['go','play','do'],answer:0,explain:'Skiing là hoạt động -ing nên dùng go.'},
              {q:'Choose the correct collocation: ___ gymnastics',options:['go','play','do'],answer:2,explain:'Gymnastics dùng với do.'},
              {q:'Choose the correct collocation: ___ horse riding',options:['play','go','do'],answer:1,explain:'Horse riding dùng với go.'}
            ],
            task:'Phân loại: football, swimming, tennis, karate, surfing, basketball, athletics, judo, horse riding, cycling, volleyball, badminton, gymnastics, table tennis, skiing, yoga, skating.'},

          {type:'grammar', title:'Language Use · like + -ing', summary:'Talk about sports you like doing.',
            intro:'Mở rộng từ play / do / go sang cấu trúc like + V-ing để nói sở thích.',
            keyPoints:['like + V-ing để nói sở thích/hoạt động yêu thích.','Khi động từ là play/do/go, đổi thành playing/doing/going sau like.','Chủ ngữ he/she/it dùng likes.'],
            examples:['I like playing football.','She likes doing gymnastics.','They like going swimming.'],
            miniQuiz:[
              {q:'I ___ football with my classmates.',options:['like playing','like play','likes playing'],answer:0,explain:'I + like + V-ing.'},
              {q:'She ___ gymnastics every weekend.',options:['like doing','likes doing','likes do'],answer:1,explain:'She + likes + V-ing.'},
              {q:'They ___ swimming in summer.',options:['like going','likes going','like go'],answer:0,explain:'They + like + going swimming.'}
            ],
            task:'Viết 4 câu về môn thể thao bạn thích/không thích, dùng like/likes + V-ing.'},

          {type:'vocabulary', title:'Sports Equipment', summary:'Match equipment with the sports that use it.',
            intro:'Học viên nối dụng cụ thể thao với môn phù hợp; một số dụng cụ có thể dùng cho nhiều môn.',
            keyPoints:['basket → basketball','bike → cycling','boat / sail → sailing','net → football / tennis / hockey / volleyball / table tennis','stick → hockey','bat → table tennis','board → surfing / windsurfing','helmet → cycling / karting','racket → tennis','skis → skiing'],
            examples:['A racket is used for tennis.','A helmet is used for cycling and karting.','A board is used for surfing and windsurfing.'],
            miniQuiz:[
              {q:'Which equipment is used for tennis?',options:['racket','skis','helmet'],answer:0,explain:'Tennis players use a racket.'},
              {q:'Which equipment can be used for surfing?',options:['board','bat','basket'],answer:0,explain:'Surfing uses a board.'}
            ],
            task:'Chọn 5 dụng cụ và nói: “A/An ___ is used for ___.”'},

          {type:'listening', title:'Listening · Unusual Sports', summary:'Bossaball, curling, karting and snowfering.',
            intro:'Luyện nghe theo ba tầng: nhận diện môn → lấy chi tiết → nhận biết thái độ người nói. Audio gốc sẽ được nối từ kho học liệu bảo vệ, không đặt trong repo public.',
            keyPoints:['Bossaball: nghe trang phục và thời điểm chơi.','Curling: nghe dụng cụ và cách người ta mô tả môn này.','Karting: nghe tốc độ và định nghĩa “kart”.','Snowfering: nghe địa điểm và dụng cụ.','Nghe lại để bắt các từ đánh giá/cảm xúc.'],
            examples:['They always wear shorts.','Special stones and brushes.','It’s a kind of chess on ice.','Up to 45 kph.','A kind of small racing car.','On the snow, on lakes and fields.'],
            checkList:[
              'Bossaball: What do they always wear? When do they usually play it?',
              'Curling: What do they use? What do people sometimes say?',
              'Karting: How fast can you go indoors? What is a kart?',
              'Snowfering: Where do they do it? What do they use?'
            ],
            task:'Khi audio được nối, làm 3 lượt nghe: 1) nhận diện sport, 2) trả lời 8 câu chi tiết, 3) ghi từ diễn tả cảm xúc.'},

          {type:'language', title:'Language Focus · a kind of', summary:'Define unfamiliar sports and equipment.',
            intro:'Dùng “It’s a kind of …” để giải thích một vật hoặc môn thể thao bằng một khái niệm quen thuộc hơn.',
            keyPoints:['What’s a helmet? → It’s a kind of hat.','What’s a racket? → It’s a kind of bat.','What’s table tennis? → It’s a kind of tennis.','What’s rugby? → It’s a kind of team game.'],
            examples:['A kart is a kind of car.','Snowfering is a kind of windsurfing on the snow.','Windsurfing is a kind of surfing on water.'],
            miniQuiz:[
              {q:'What’s a kart?',options:['It’s a kind of car.','It’s a kind of hat.','It’s a kind of tennis.'],answer:0,explain:'Kart được giải thích như một loại xe nhỏ.'},
              {q:'What’s rugby?',options:['It’s a kind of team game.','It’s a kind of bat.','It’s a kind of surfing.'],answer:0,explain:'Rugby là một team game.'}
            ],
            task:'Tự tạo 3 câu hỏi “What’s …?” và trả lời bằng “It’s a kind of …”.'},

          {type:'grammar', title:'Grammar · Adverbs of Frequency', summary:'always · usually · often · sometimes · never',
            intro:'Học viên dùng trạng từ tần suất để mô tả thói quen và rút ra vị trí của chúng trong câu.',
            keyPoints:['Với động từ thường: adverb đứng trước động từ chính.','Với be: adverb đứng sau be.','Trong câu phủ định với do/does not: adverb thường đứng sau don’t/doesn’t và trước động từ chính.'],
            examples:['Basketball players are often tall.','Cyclists usually go very fast.','Surfers always get wet.','Good athletes never smoke.','I don’t often go to the countryside.'],
            miniQuiz:[
              {q:'Choose the correct sentence.',options:['She often comes to my house.','She comes often to my house.','She comes to often my house.'],answer:0,explain:'often đứng trước động từ chính comes.'},
              {q:'Choose the correct sentence.',options:['People usually are happy at weddings.','People are usually happy at weddings.','People are happy usually at weddings.'],answer:1,explain:'Với be, trạng từ đứng sau be.'},
              {q:'Choose the correct sentence.',options:["He doesn’t usually make jokes.","He usually doesn’t make jokes.","He doesn’t make usually jokes."],answer:0,explain:'Trong mẫu này, usually đứng sau doesn’t và trước make.'}
            ],
            task:'Viết 7 câu theo thang never → sometimes → often → usually → always về bản thân hoặc gia đình.'},

          {type:'speaking', title:'Speaking · Sports Habits', summary:'Ask and answer about habits using target language.',
            intro:'Học viên thực hành hỏi–đáp sử dụng play/do/go và trạng từ tần suất.',
            keyPoints:['Do you often finish your homework?','Does your dad sometimes play tennis?','Are you always tidy?','Có thể dùng thêm: make breakfast, play computer games, be polite, wear expensive clothes, remember birthdays.'],
            examples:['Do you often play badminton? — Yes, often.','Are you always active at weekends? — No, not always.'],
            task:'Làm việc theo cặp: hỏi tối thiểu 5 câu, ghi lại 3 câu trả lời của bạn học và báo cáo lại.'},

          {type:'writing', title:'Writing · Personal Sports Habits', summary:'Turn grammar and vocabulary into a short personal text.',
            intro:'Từ phần nói, học viên viết các câu đúng về thói quen thể thao và sở thích cá nhân.',
            keyPoints:['Dùng đúng play/do/go.','Dùng ít nhất 3 trạng từ tần suất.','Có thể thêm because để nêu lý do.','Kiểm tra trật tự từ trước khi nộp.'],
            examples:['I usually go swimming at weekends because it helps me relax.','I sometimes watch sport on television, but I never watch rugby.'],
            task:'Viết đoạn 60–80 từ về sports habits. Bản sau sẽ cho phép đánh máy hoặc chụp ảnh bài viết tay để nộp.'},

          {type:'review', title:'Consolidation · What You Can Do', summary:'Review vocabulary, listening, grammar, speaking and writing.',
            intro:'Tổng kết toàn bộ Lesson 1.1 trước khi chuyển sang Lesson 1.2.',
            keyPoints:['Listening: specific information about unusual sports.','Vocabulary: sports, equipment, play/go/do.','Grammar: Present Simple + frequency adverbs.','Speaking: talk about sports habits.','Writing: routines and sport preferences.'],
            examples:['play football','go swimming','do gymnastics','I often play …','I am usually …'],
            task:'Tự đánh dấu 5 mục: I can name sports / use play-do-go / understand key listening details / use frequency adverbs / talk about my sports habits.'},

          {type:'assignment', title:'Homework', summary:'Write true sentences using frequency adverbs.',
            intro:'Bài tập cuối Lesson 1.1 để củng cố ngữ pháp và cá nhân hóa ngôn ngữ.',
            keyPoints:['Câu phải đúng với bản thân.','Dùng trạng từ tần suất đúng vị trí.','Không lặp một trạng từ cho tất cả câu.'],
            examples:['I sometimes watch sport on TV.','I never go skiing.','I often play badminton with my friends.'],
            task:'Viết ít nhất 5 câu thật về bản thân/gia đình, dùng tối thiểu 4 trạng từ tần suất khác nhau.'}
        ]
      },

      { id:'u1-2', title:'Lesson 1.2 · Pronunciation & Exam Folder 1', periods:4, sections:[
        {type:'audio', title:'Pronunciation', summary:'Contrast /aɪ/, /iː/, /ɪ/.',
          intro:'Nhận biết và luyện ba âm nguyên âm thường gây nhầm ở trình độ B1.',
          keyPoints:['/aɪ/ như trong like','/iː/ như trong see','/ɪ/ như trong big'],
          examples:['like – bike – ride','see – team – wheel','big – hill – little'],
          task:'Đọc từng nhóm từ, ghi âm lại và tự đối chiếu độ dài/ngắn của nguyên âm.'},
        {type:'learn', title:'Vocabulary Tree & Free-time Activity', summary:'Build word families and describe a sport/hobby.',
          intro:'Tổ chức từ vựng theo nhóm nghĩa để ghi nhớ tốt hơn và tái sử dụng khi nói.',
          keyPoints:['people/roles','clothes','equipment','actions'],
          examples:['player – goalkeeper – captain – team','shirt – shorts – boots','ball – goal – equipment'],
          task:'Tạo một vocabulary tree cho môn thể thao bạn chọn và dùng ít nhất 6 từ để mô tả.'},
        {type:'exam', title:'Exam Folder 1 · Reading Part 1', summary:'Short everyday texts; meaning matching.',
          intro:'Luyện chiến lược đọc văn bản ngắn: email, notice, message và chọn câu diễn đạt cùng nghĩa.',
          keyPoints:['Đọc yêu cầu trước','Gạch từ khóa ở phương án','So sánh ý nghĩa, không chỉ tìm từ giống nhau','Loại phương án có chi tiết trái nghĩa hoặc thêm thông tin'],
          examples:['Text says the café is crowded, so they eat outside → choose the option expressing the same idea.'],
          task:'Làm 5 câu luyện Reading Part 1 trong Question Bank khi module được nối vào backend.'},
        {type:'practice', title:'Speaking Part 1', summary:'Ask and answer personal-information questions.',
          intro:'Luyện phản xạ hỏi–đáp thông tin cá nhân theo dạng Speaking Part 1.',
          keyPoints:['surname/name','hometown and place of residence','age','travel to school/work','languages','free-time activities'],
          examples:['Where do you live?','How do you travel to work?','What do you like doing in your free time?'],
          task:'Trả lời 6 câu hỏi trong 60–90 giây. Bản sau sẽ cho phép ghi âm và lưu tiến bộ qua từng lần.'},
        {type:'assignment', title:'Homework', summary:'Write a short text about yourself.',
          intro:'Viết đoạn giới thiệu bản thân có tổ chức, dùng thông tin từ phần Speaking.',
          keyPoints:['Mở đầu bằng tên và nơi sống','Thêm học tập/công việc','Nêu ngôn ngữ và sở thích','Kiểm tra Present Simple và trật tự từ'],
          examples:['My name is … I live in … In my free time, I usually …'],
          task:'Viết 80–100 từ. Bản private sẽ hỗ trợ nhập trực tiếp hoặc upload ảnh bài viết tay.'}
      ]}
    ],
    quiz:{
      title:'Unit 1 · Quick Check',
      questions:[
        {id:'q1',q:'Choose the natural collocation.',options:['do football','play football','go football'],answer:1,explain:'Ball/team sports commonly use play.'},
        {id:'q2',q:'Choose the correct word order.',options:['She comes often here.','She often comes here.','She comes here often always.'],answer:1,explain:'Frequency adverbs normally go before a main verb.'},
        {id:'q3',q:'Which sentence is best for describing a hobby?',options:['I usually go swimming at weekends.','I usually swimming at weekends.','I go usually swim at weekends.'],answer:0,explain:'go + -ing; the frequency adverb is placed before the main verb phrase.'}
      ]
    }
  }]
};
