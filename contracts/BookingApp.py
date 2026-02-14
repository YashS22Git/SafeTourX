from pyteal import *

def approval_program():
    # Global state keys
    # hotel_id (Bytes), checked_in (Int), amount (Int), deadline (Int)
    
    on_book = Seq([
        # Initialize booking state
        # In a real app, this might use a map or multiple apps
        # Here we use global state for simplicity in a demo
        App.globalPut(Bytes("hotel_id"), Txn.application_args[1]),
        App.globalPut(Bytes("amount"), Btoi(Txn.application_args[2])),
        App.globalPut(Bytes("deadline"), Global.round() + Int(1000)), # 1000 blocks approx
        App.globalPut(Bytes("status"), Bytes("PENDING")),
        Return(Int(1))
    ])

    on_checkin = Seq([
        Assert(App.globalGet(Bytes("status")) == Bytes("PENDING")),
        # In a real app, only the hotel or user with proof can call this
        App.globalPut(Bytes("status"), Bytes("COMPLETED")),
        Return(Int(1))
    ])

    on_refund = Seq([
        Assert(App.globalGet(Bytes("status")) == Bytes("PENDING")),
        Assert(Global.round() > App.globalGet(Bytes("deadline"))),
        App.globalPut(Bytes("status"), Bytes("REFUNDED")),
        Return(Int(1))
    ])

    program = Cond(
        [Txn.application_id() == Int(0), Return(Int(1))],
        [Txn.on_completion() == OnComplete.DeleteApplication, Return(Int(0))],
        [Txn.on_completion() == OnComplete.UpdateApplication, Return(Int(1))],
        [Txn.application_args[0] == Bytes("book"), on_book],
        [Txn.application_args[0] == Bytes("checkin"), on_checkin],
        [Txn.application_args[0] == Bytes("refund"), on_refund],
    )

    return compileTeal(program, Mode.Application, version=5)

def clear_state_program():
    return compileTeal(Return(Int(1)), Mode.Application, version=5)

if __name__ == "__main__":
    with open("booking_approval.teal", "w") as f:
        f.write(approval_program())
    with open("booking_clear.teal", "w") as f:
        f.write(clear_state_program())
