fn main() {
    fn greet() {
        println!("Hello, world!");
    }

    fn add(a: i32, b: i32) -> i32 {
        return a + b;
    }

    greet();

    let a = 7;
    let b = 2;

    let sum = add(a, b);
    println!("{} + {} = {}", a, b, sum);
}
