describe('Matching', function(){

	var widgetInfo = window.__demo__['build/demo'];
	var qset = widgetInfo.qset;
	var $scope = {};
	var ctrl={};
	var initialwordPairs = {};
	var $compile = {};

	describe('Creator Controller', function() {

		module.sharedInjector();
		beforeAll(module('matchingCreator'));

		beforeAll(inject(function(_$compile_, $rootScope, $controller){
			$scope = $rootScope.$new();
			ctrl = $controller('matchingCreatorCtrl', { $scope: $scope });
			$compile = _$compile_;
		}));

		beforeEach(function () {
			spyOn(Materia.CreatorCore, 'save').and.callFake(function(title, qset){
				//the creator core calls this on the creator when saving is successful
				$scope.onSaveComplete();
				return {title: title, qset: qset};
			});
			spyOn(Materia.CreatorCore, 'cancelSave').and.callFake(function(msg){
				throw new Error(msg);
			});
			spyOn($scope, 'addWordPair').and.callThrough();
		});

		it('should make a new widget', function(){
			$scope.initNewWidget({name: 'matcher'});
			expect($scope.widget.wordPairs).toEqual([]);
			expect($scope.showIntroDialog).toBe(true);
			//this defaults if intro title is not set
			expect($scope.widget.title).toEqual("My Matching widget");
		});

		it('should properly set title from input', function () {
			//should give default title if no introTitle defined
			$scope.setTitle();
			expect($scope.widget.title).toEqual("My Matching widget");
			//introTitle is ng-model on input
			$scope.introTitle = "introTitle";
			$scope.setTitle();
			expect($scope.widget.title).toEqual("introTitle");
		});

		it('should properly hide the title-change modal', function(){
			$scope.showTitleDialog = true;
			$scope.hideCover();
			expect($scope.showTitleDialog).toBe(false);
			$scope.showIntroDialog= true;
			$scope.hideCover();
			expect($scope.showIntroDialog).toBe(false);
		});

		it('should make an existing widget', function(){
			$scope.initExistingWidget('matcher', widgetInfo, qset.data);
			expect($scope.widget.title).toEqual('matcher');
			expect($scope.widget.wordPairs[0]).toEqual({ question: 'cambiar', answer: 'to change', id: '' });
			expect($scope.widget.wordPairs[1]).toEqual({ question: 'preferir', answer: 'to prefer', id: '' });
			initialwordPairs = JSON.parse(JSON.stringify( $scope.widget.wordPairs));
		});

		it('should save the widget properly', function(){
			//since we're spying on this, it should return an object with a title and a qset if it determines the widget is ready to save
			var successReport = $scope.onSaveClicked();
			//make sure the title was sent correctly
			expect(successReport.title).toBe($scope.widget.title);
			//check one of the questions and its answers to make sure it was sent correctly
			var testQuestion = successReport.qset.items[0];
			expect(testQuestion.questions[0].text).toBe('cambiar');
			expect(testQuestion.answers[0].text).toBe('to change');
		});

		it('should cancel saving if something is invalid', function(){
			//unset the widget title
			$scope.widget.title = '';
			//the error message should be what we expect it to be
			expect(function(){
				$scope.onSaveClicked();
			}).toThrow(new Error('Widget not ready to save.'));
		});

		it('should properly remove word pair', function(){
			$scope.removeWordPair(0);
			expect($scope.widget.wordPairs[0]).toEqual({question: 'preferir', answer: 'to prefer', id: ''});
		});

		it('should properly add word pairs', function(){
			//clear the current word pairs accumulated from previous tests
			$scope.widget.wordPairs = [];
			//if fields on word pairs are empty- default values are given
			$scope.addWordPair();
			expect($scope.widget.wordPairs[0]).toEqual({question: null, answer: null, id: ''});
			$scope.addWordPair("question", "answer", "12");
			expect($scope.widget.wordPairs[1]).toEqual({question: "question", answer: "answer", id: '12'});
		});

		it('should import questions properly', function(){
			var importing = qset.data.items[0].items;
			//clear the current word pairs accumulated from previous tests
			$scope.widget.wordPairs = [];
			//verify we have a clean slate to test this function
			expect($scope.widget.wordPairs).toEqual([]);
			$scope.onQuestionImportComplete(importing);
			expect($scope.widget.wordPairs).toEqual(initialwordPairs);
		});

		it('should autosize correctly', function () {
			var lessThan15chars = 'small';
			var greaterThan15chars = 'thisIsNineteenChars';
			var longPair = {question: lessThan15chars, answer: greaterThan15chars};
			var shortPair = {question: lessThan15chars, answer: lessThan15chars};
			var smallHeight = $scope.autoSize(shortPair);
			var bigHeight = $scope.autoSize(longPair);
			//test given to short pairs
			expect(smallHeight).toEqual({height: '25px'});
			//test given a short and a long pair
			//javascript floating point multiplication makes 50.9 a weird number
			expect(bigHeight).toEqual({height: '50.900000000000006px'});
			//test if question given empty value
			expect($scope.autoSize({question: '', answer: 'answer'})).toEqual({height: '25px'});
			//test if answer given empty value
			expect($scope.autoSize({question: 'question', answer: ''})).toEqual({height: '25px'});
			//test if both question and answer are given empty values
			expect($scope.autoSize({question: '', answer: ''})).toEqual({height: '25px'});
		});


			// //for simplicity, just copy the demo qset's questions
			// var importing = qset.data.items;
			// //add another to make sure the importer will only import three questions
			// var newQuestion = {
			// 	materiaType: 'question',
			// 	questions: [{text: 'Extra'}],
			// 	answers: [{
			// 		id:    '',
			// 		text:  'extra',
			// 		value: 100
			// 	}],
			// 	id: 4,
			// 	type: 'MC'
			// };
			// importing.push(newQuestion);
			// //this should create three questions and cause an alert, since we tried importing four
			// $scope.onQuestionImportComplete(importing);
			// //make sure the alert went out
			// expect(Materia.CreatorCore.alert.calls.mostRecent().args).toEqual(['3 Question Limit', 'For this widget, you may create up to 3 questions.']);
			// Materia.CreatorCore.alert.calls.reset();
			// //make sure the first three questions were imported
			// expect($scope.questions.length).toBe(3);



			// var elementModal = angular.element("<input type='text' placeholder='My Matching widget' ng-model='widget.title' ng-enter='hideCover()' focus-me='showTitleDialog'>");
			// var elementModalButton = angular.element("<input type='button' value='Get Started' ng-click='setTitle()'>")
			// // element[0].value = 'thisistwentyonecharcs';
			// elementModalButton = $compiler(elementModalButton)($scope);
			// var clickButton = elementModalButton.triggerHandler("click");

	});
});