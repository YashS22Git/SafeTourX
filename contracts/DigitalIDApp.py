from pyteal import *

def approval_program():
    # Global state keys
    # Local state keys
    id_hash_key = Bytes("id_hash")

    # Registration logic
    # Expects argument 0: "register", argument 1: the hash
    on_register = Seq([
        Assert(Txn.application_args.length() == Int(2)),
        App.localPut(Txn.sender(), id_hash_key, Txn.application_args[1]),
        Return(Int(1))
    ])

    # Update logic (if needed)
    on_update = Seq([
        Assert(Txn.application_args.length() == Int(2)),
        App.localPut(Txn.sender(), id_hash_key, Txn.application_args[1]),
        Return(Int(1))
    ])

    program = Cond(
        [Txn.application_id() == Int(0), Return(Int(1))], # Deploys
        [Txn.on_completion() == OnComplete.DeleteApplication, Return(Int(0))], # No delete
        [Txn.on_completion() == OnComplete.UpdateApplication, Return(Int(1))], # Allow update for demo
        [Txn.on_completion() == OnComplete.CloseOut, Return(Int(1))],
        [Txn.on_completion() == OnComplete.OptIn, Return(Int(1))],
        [Txn.application_args[0] == Bytes("register"), on_register],
        [Txn.application_args[0] == Bytes("update"), on_update],
    )

    return compileTeal(program, Mode.Application, version=5)

def clear_state_program():
    return compileTeal(Return(Int(1)), Mode.Application, version=5)

if __name__ == "__main__":
    with open("digital_id_approval.teal", "w") as f:
        f.write(approval_program())
    with open("digital_id_clear.teal", "w") as f:
        f.write(clear_state_program())
