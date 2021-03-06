/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component, Directive, Inject, Injectable, InjectionToken, Input, NgModule, OnDestroy, Pipe, PipeTransform, ViewChild} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {expect} from '@angular/platform-browser/testing/src/matchers';

describe('pipe', () => {
  @Pipe({name: 'countingPipe'})
  class CountingPipe implements PipeTransform {
    state: number = 0;
    transform(value: any) { return `${value} state:${this.state++}`; }
  }

  @Pipe({name: 'multiArgPipe'})
  class MultiArgPipe implements PipeTransform {
    transform(value: any, arg1: any, arg2: any, arg3 = 'default') {
      return `${value} ${arg1} ${arg2} ${arg3}`;
    }
  }

  it('should support interpolation', () => {
    @Component({
      template: '{{person.name | countingPipe}}',
    })
    class App {
      person = {name: 'bob'};
    }

    TestBed.configureTestingModule({declarations: [App, CountingPipe]});
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toBe('bob state:0');
  });

  it('should throw if pipe is not found', () => {
    @Component({
      template: '{{1 | randomPipeName}}',
    })
    class App {
    }

    TestBed.configureTestingModule({declarations: [App]});

    expect(() => {
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
    }).toThrowError(/The pipe 'randomPipeName' could not be found/);
  });

  it('should support bindings', () => {
    @Directive({selector: '[my-dir]'})
    class Dir {
      @Input()
      dirProp: string = '';
    }

    @Pipe({name: 'double'})
    class DoublePipe implements PipeTransform {
      transform(value: any) { return `${value}${value}`; }
    }

    @Component({
      template: `<div my-dir [dirProp]="'a'|double"></div>`,
    })
    class App {
      @ViewChild(Dir, {static: false}) directive !: Dir;
    }

    TestBed.configureTestingModule({declarations: [App, DoublePipe, Dir]});
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(fixture.componentInstance.directive.dirProp).toBe('aa');
  });

  it('should support arguments in pipes', () => {
    @Component({
      template: `{{person.name | multiArgPipe:'one':person.address.city}}`,
    })
    class App {
      person = {name: 'value', address: {city: 'two'}};
    }

    TestBed.configureTestingModule({declarations: [App, MultiArgPipe]});
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toBe('value one two default');
  });

  it('should support calling pipes with different number of arguments', () => {
    @Component({
      template: `{{person.name | multiArgPipe:'a':'b'}} {{0 | multiArgPipe:1:2:3}}`,
    })
    class App {
      person = {name: 'value'};
    }

    TestBed.configureTestingModule({declarations: [App, MultiArgPipe]});
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toEqual('value a b default 0 1 2 3');
  });

  it('should do nothing when no change', () => {
    let calls: any[] = [];

    @Pipe({name: 'identityPipe'})
    class IdentityPipe implements PipeTransform {
      transform(value: any) {
        calls.push(value);
        return value;
      }
    }

    @Component({
      template: `{{person.name | identityPipe}}`,
    })
    class App {
      person = {name: 'Megatron'};
    }

    TestBed.configureTestingModule({declarations: [App, IdentityPipe]});
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(calls).toEqual(['Megatron']);

    fixture.detectChanges();

    expect(calls).toEqual(['Megatron']);
  });

  it('should support duplicates by using the later entry', () => {
    @Pipe({name: 'duplicatePipe'})
    class DuplicatePipe1 implements PipeTransform {
      transform(value: any) { return `${value} from duplicate 1`; }
    }

    @Pipe({name: 'duplicatePipe'})
    class DuplicatePipe2 implements PipeTransform {
      transform(value: any) { return `${value} from duplicate 2`; }
    }

    @Component({
      template: '{{person.name | duplicatePipe}}',
    })
    class App {
      person = {name: 'bob'};
    }

    TestBed.configureTestingModule({declarations: [App, DuplicatePipe1, DuplicatePipe2]});
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toEqual('bob from duplicate 2');
  });

  it('should support pipe in context of ternary operator', () => {
    @Pipe({name: 'pipe'})
    class MyPipe implements PipeTransform {
      transform(value: any): any { return value; }
    }

    @Component({
      template: `{{ condition ? 'a' : 'b' | pipe }}`,
    })
    class App {
      condition = false;
    }

    TestBed.configureTestingModule({declarations: [App, MyPipe]});
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(fixture.nativeElement).toHaveText('b');

    fixture.componentInstance.condition = true;
    fixture.detectChanges();
    expect(fixture.nativeElement).toHaveText('a');
  });

  describe('pure', () => {
    it('should call pure pipes only if the arguments change', () => {
      @Component({
        template: '{{person.name | countingPipe}}',
      })
      class App {
        person = {name: null as string | null};
      }

      TestBed.configureTestingModule({declarations: [App, CountingPipe]});
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();

      // change from undefined -> null
      fixture.componentInstance.person.name = null;
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toEqual('null state:0');

      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toEqual('null state:0');

      // change from null -> some value
      fixture.componentInstance.person.name = 'bob';
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toEqual('bob state:1');

      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toEqual('bob state:1');

      // change from some value -> some other value
      fixture.componentInstance.person.name = 'bart';
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toEqual('bart state:2');

      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toEqual('bart state:2');
    });
  });

  describe('impure', () => {
    let impurePipeInstances: CountingImpurePipe[] = [];

    @Pipe({name: 'countingImpurePipe', pure: false})
    class CountingImpurePipe implements PipeTransform {
      state: number = 0;
      transform(value: any) { return `${value} state:${this.state++}`; }
      constructor() { impurePipeInstances.push(this); }
    }

    beforeEach(() => impurePipeInstances = []);
    afterEach(() => impurePipeInstances = []);

    it('should call impure pipes on each change detection run', () => {
      @Component({
        template: '{{person.name | countingImpurePipe}}',
      })
      class App {
        person = {name: 'bob'};
      }

      TestBed.configureTestingModule({declarations: [App, CountingImpurePipe]});
      const fixture = TestBed.createComponent(App);
      const pipe = impurePipeInstances[0];

      spyOn(pipe, 'transform').and.returnValue('');
      expect(pipe.transform).not.toHaveBeenCalled();

      fixture.detectChanges();
      expect(pipe.transform).toHaveBeenCalledTimes(2);

      fixture.detectChanges();
      expect(pipe.transform).toHaveBeenCalledTimes(4);
    });

    it('should not cache impure pipes', () => {
      @Component({
        template: `
          <div [id]="0 | countingImpurePipe">{{1 | countingImpurePipe}}</div>
          <div [id]="2 | countingImpurePipe">{{3 | countingImpurePipe}}</div>
        `,
      })
      class App {
      }

      TestBed.configureTestingModule({declarations: [App, CountingImpurePipe]});
      TestBed.createComponent(App);

      expect(impurePipeInstances.length).toEqual(4);
      expect(impurePipeInstances[0]).toBeAnInstanceOf(CountingImpurePipe);
      expect(impurePipeInstances[1]).toBeAnInstanceOf(CountingImpurePipe);
      expect(impurePipeInstances[1]).not.toBe(impurePipeInstances[0]);
      expect(impurePipeInstances[2]).toBeAnInstanceOf(CountingImpurePipe);
      expect(impurePipeInstances[2]).not.toBe(impurePipeInstances[0]);
      expect(impurePipeInstances[3]).toBeAnInstanceOf(CountingImpurePipe);
      expect(impurePipeInstances[3]).not.toBe(impurePipeInstances[0]);
    });
  });

  describe('lifecycles', () => {
    it('should call ngOnDestroy on pipes', () => {
      let destroyCalls = 0;

      @Pipe({name: 'pipeWithOnDestroy'})
      class PipeWithOnDestroy implements PipeTransform, OnDestroy {
        ngOnDestroy() { destroyCalls++; }
        transform(value: any): any { return null; }
      }

      @Component({
        template: '{{1 | pipeWithOnDestroy}}',
      })
      class App {
      }

      TestBed.configureTestingModule({declarations: [App, PipeWithOnDestroy]});
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      fixture.destroy();

      expect(destroyCalls).toBe(1);
    });
  });

  describe('injection mechanism', () => {
    it('should be able to handle Service injection', () => {
      @Injectable()
      class Service {
        title = 'Service Title';
      }

      @Pipe({name: 'myConcatPipe'})
      class ConcatPipe implements PipeTransform {
        constructor(public service: Service) {}
        transform(value: string): string { return `${value} - ${this.service.title}`; }
      }

      @Component({
        template: '{{title | myConcatPipe}}',
      })
      class App {
        title = 'MyComponent Title';
      }

      TestBed.configureTestingModule({declarations: [App, ConcatPipe], providers: [Service]});
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toBe('MyComponent Title - Service Title');
    });

    it('should be able to handle Token injections', () => {
      class Service {
        title = 'Service Title';
      }

      const token = new InjectionToken<Service>('service token');

      @Pipe({name: 'myConcatPipe'})
      class ConcatPipe implements PipeTransform {
        constructor(@Inject(token) public service: Service) {}
        transform(value: string): string { return `${value} - ${this.service.title}`; }
      }

      @Component({
        template: '{{title | myConcatPipe}}',
      })
      class App {
        title = 'MyComponent Title';
      }

      TestBed.configureTestingModule({
        declarations: [App, ConcatPipe],
        providers: [{provide: token, useValue: new Service()}]
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toBe('MyComponent Title - Service Title');
    });

    it('should be able to handle Module injection', () => {
      @Injectable()
      class Service {
        title = 'Service Title';
      }

      @NgModule({providers: [Service]})
      class SomeModule {
      }

      @Pipe({name: 'myConcatPipe'})
      class ConcatPipe implements PipeTransform {
        constructor(public service: Service) {}
        transform(value: string): string { return `${value} - ${this.service.title}`; }
      }

      @Component({
        template: '{{title | myConcatPipe}}',
      })
      class App {
        title = 'MyComponent Title';
      }

      TestBed.configureTestingModule({declarations: [App, ConcatPipe], imports: [SomeModule]});
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toBe('MyComponent Title - Service Title');
    });

  });

});
