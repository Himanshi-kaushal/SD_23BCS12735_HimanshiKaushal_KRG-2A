class BankAccount {
private:
    int balance;

public:
    BankAccount() {
        balance = 0;
    }

    void deposit(int amount) {
        balance += amount;
    }

    void withdraw(int amount) {
        balance -= amount;
    }

    int getBalance() {
        return balance;
    }
};

class StatementPrinter {
public:
    void printStatement(BankAccount &account) {
        cout << "Balance: " << account.getBalance() << endl;
    }
};

class AccountRepository {
public:
    void save(BankAccount &account) {
        cout << "Saving account with balance: "
             << account.getBalance() << endl;
    }
};

int main() {
    BankAccount account;

    account.deposit(1000);
    account.withdraw(300);

    StatementPrinter printer;
    printer.printStatement(account);

    AccountRepository repo;
    repo.save(account);

    return 0;
}
